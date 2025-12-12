/**
 * ML Service - Integrasi dengan Machine Learning API
 * Service ini bertanggung jawab untuk komunikasi dengan ML API
 * dan memproses sensor readings untuk mendapatkan predictions
 */

import { db } from '../models/db';
import { machines } from '../models/schema';
import { eq } from 'drizzle-orm';
import { cache } from '../utils/cache';

const ML_API_BASE_URL = process.env.ML_API_URL || 'http://localhost:8000';

interface SensorReading {
    readingId: string;
    machineId: string;
    airTemperatureK: number;
    processTemperatureK: number;
    rotationalSpeedRpm: number;
    torqueNm: number;
    toolWearMin: number;
}

interface MLBinaryPredictionResponse {
    status_code: number;
    message: string;
    data: {
        prediction: number; // 0 or 1
        prediction_label: string; // "not failed" or "failed"
        probability: number;
        confidence: number;
        input_data: any;
    };
}

interface MLTypePredictionResponse {
    status_code: number;
    message: string;
    data: {
        prediction: string; // e.g., "Tool Wear Failure", "No Failure"
        probabilities: Record<string, number>;
        confidence: number;
        ambiguous?: boolean;
        top_k?: Array<{ label: string; prob: number }>;
        suggested_override?: string;
        input_data: any;
    };
}

interface MLHealthResponse {
    status_code: number;
    message: string;
    data: {
        binary_model_loaded: boolean;
        failure_type_model_loaded: boolean;
    };
}

/**
 * Check ML API health
 */
export async function checkMLHealth(): Promise<MLHealthResponse> {
    try {
        const response = await fetch(`${ML_API_BASE_URL}/api/v1/failure/health`);
        
        if (!response.ok) {
            throw new Error(`ML API health check failed: ${response.status}`);
        }
        
        return await response.json() as MLHealthResponse;
    } catch (error: any) {
        console.error('ML Health Check Error:', error.message);
        throw new Error(`Failed to connect to ML API: ${error.message}`);
    }
}

/**
 * Predict binary failure (failed or not failed)
 */
export async function predictBinaryFailure(
    reading: SensorReading,
    machineType: string
): Promise<MLBinaryPredictionResponse> {
    try {
        const requestBody = {
            product_id: reading.readingId,
            type: machineType,
            air_temperature: reading.airTemperatureK,
            process_temperature: reading.processTemperatureK,
            rotational_speed: reading.rotationalSpeedRpm,
            torque: reading.torqueNm,
            tool_wear: reading.toolWearMin
        };

        console.log('Calling ML API - Binary Prediction:', requestBody);

        const response = await fetch(`${ML_API_BASE_URL}/api/v1/failure/predict/binary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ML API binary prediction failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as MLBinaryPredictionResponse;
        console.log('ML API Binary Response:', result);
        
        return result;
    } catch (error: any) {
        console.error('Binary Prediction Error:', error.message);
        throw new Error(`Failed to get binary prediction: ${error.message}`);
    }
}

/**
 * Predict failure type (multiclass)
 */
export async function predictFailureType(
    reading: SensorReading,
    machineType: string
): Promise<MLTypePredictionResponse> {
    try {
        const requestBody = {
            product_id: reading.readingId,
            type: machineType,
            air_temperature: reading.airTemperatureK,
            process_temperature: reading.processTemperatureK,
            rotational_speed: reading.rotationalSpeedRpm,
            torque: reading.torqueNm,
            tool_wear: reading.toolWearMin
        };

        console.log('Calling ML API - Type Prediction:', requestBody);

        const response = await fetch(`${ML_API_BASE_URL}/api/v1/failure/predict/type`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ML API type prediction failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as MLTypePredictionResponse;
        console.log('ML API Type Response:', result);
        
        return result;
    } catch (error: any) {
        console.error('Type Prediction Error:', error.message);
        throw new Error(`Failed to get failure type prediction: ${error.message}`);
    }
}

/**
 * Get combined prediction (binary + type)
 * This is the main function to use for processing sensor readings
 * OPTIMIZED: Added caching for machine info to reduce DB queries
 */
export async function getCombinedPrediction(reading: SensorReading) {
    try {
        // OPTIMIZED: Try to get machine from cache first
        const cacheKey = `machine:${reading.machineId}`;
        let machine = cache.get<any>(cacheKey);
        
        if (!machine) {
            // Cache miss - fetch from database
            const [dbMachine] = await db.select()
                .from(machines)
                .where(eq(machines.machineId, reading.machineId));

            if (!dbMachine) {
                throw new Error(`Machine not found: ${reading.machineId}`);
            }
            
            machine = dbMachine;
            
            // Cache for 10 minutes (machines rarely change)
            cache.set(cacheKey, machine, 600);
        }

        const machineType = machine.type; // L, M, or H

        // Get binary prediction first
        const binaryResult = await predictBinaryFailure(reading, machineType);
        const isFailure = binaryResult.data.prediction === 1;
        const binaryConfidence = binaryResult.data.confidence;
        const probability = binaryResult.data.probability;

        // If binary predicts failure, get the failure type
        let failureType = 'No Failure';
        let typeConfidence = 1.0;
        let explanationData: any = {
            binary_prediction: binaryResult.data,
            machine_info: {
                machine_id: reading.machineId,
                machine_code: machine.code,
                machine_name: machine.name,
                machine_type: machineType
            }
        };
        let naturalLanguageReason = '';

        if (isFailure) {
            const typeResult = await predictFailureType(reading, machineType);
            failureType = typeResult.data.prediction;
            typeConfidence = typeResult.data.confidence;
            
            explanationData.type_prediction = typeResult.data;
            
            // Generate natural language explanation
            naturalLanguageReason = generateNaturalLanguageReason(
                machine,
                reading,
                binaryResult.data,
                typeResult.data
            );
        } else {
            naturalLanguageReason = `Mesin ${machine.name} (${machine.code}) dalam kondisi normal. Probabilitas kegagalan rendah (${(probability * 100).toFixed(2)}%). Semua parameter sensor dalam batas aman.`;
        }

        return {
            isFailure,
            failureType,
            confidenceScore: isFailure ? typeConfidence : binaryConfidence,
            probability,
            explanationData,
            naturalLanguageReason
        };
    } catch (error: any) {
        console.error('Combined Prediction Error:', error.message);
        throw error;
    }
}

/**
 * Generate natural language explanation for the prediction
 */
function generateNaturalLanguageReason(
    machine: any,
    reading: SensorReading,
    binaryData: any,
    typeData: any
): string {
    const machineName = `${machine.name} (${machine.code})`;
    const failureType = typeData.prediction;
    const confidence = (typeData.confidence * 100).toFixed(2);
    const probability = (binaryData.probability * 100).toFixed(2);

    let reason = `Mesin ${machineName} diprediksi akan mengalami ${failureType} dengan tingkat keyakinan ${confidence}%. `;
    reason += `Probabilitas kegagalan: ${probability}%. `;

    // Add specific sensor insights
    const insights: string[] = [];
    
    if (reading.airTemperatureK > 303) {
        insights.push(`suhu udara tinggi (${reading.airTemperatureK}K)`);
    }
    
    if (reading.processTemperatureK > 313) {
        insights.push(`suhu proses tinggi (${reading.processTemperatureK}K)`);
    }
    
    if (reading.toolWearMin > 200) {
        insights.push(`keausan alat tinggi (${reading.toolWearMin} menit)`);
    }
    
    if (reading.torqueNm > 60) {
        insights.push(`torsi tinggi (${reading.torqueNm} Nm)`);
    }
    
    if (reading.rotationalSpeedRpm < 1300) {
        insights.push(`kecepatan rotasi rendah (${reading.rotationalSpeedRpm} RPM)`);
    }

    if (insights.length > 0) {
        reason += `Faktor risiko: ${insights.join(', ')}.`;
    }

    // Add ambiguity warning if needed
    if (typeData.ambiguous) {
        reason += ` Perhatian: Prediksi tipe kegagalan memiliki ambiguitas. Disarankan untuk verifikasi manual.`;
    }

    return reason;
}
