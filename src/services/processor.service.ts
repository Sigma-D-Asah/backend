/**
 * Background Processor - Process unprocessed sensor readings
 * 
 * This service runs in the background to:
 * 1. Find sensor readings that haven't been processed (isProcessed = false)
 * 2. Send them to ML API for prediction
 * 3. Save the prediction results to aiPredictions table
 * 4. Mark the sensor reading as processed
 */

import cron from 'node-cron';
import { getUnprocessedReadingsService, markReadingAsProcessedService } from './sensors.service';
import { createPredictionService } from './predictions.service';
import { getCombinedPrediction, checkMLHealth } from './ml.service';

interface ProcessResult {
    success: boolean;
    readingId: string;
    predictionId?: string;
    error?: string;
}

/**
 * Process a single sensor reading
 */
async function processSingleReading(reading: any): Promise<ProcessResult> {
    try {
        console.log(`Processing reading ${reading.readingId}...`);

        // Get prediction from ML service
        const prediction = await getCombinedPrediction({
            readingId: reading.readingId,
            machineId: reading.machineId,
            airTemperatureK: reading.airTemperatureK,
            processTemperatureK: reading.processTemperatureK,
            rotationalSpeedRpm: reading.rotationalSpeedRpm,
            torqueNm: reading.torqueNm,
            toolWearMin: reading.toolWearMin
        });

        // Save prediction to database
        const savedPredictions = await createPredictionService({
            readingId: reading.readingId,
            machineId: reading.machineId,
            isFailure: prediction.isFailure,
            failureType: prediction.failureType,
            confidenceScore: prediction.confidenceScore,
            explanationData: prediction.explanationData,
            naturalLanguageReason: prediction.naturalLanguageReason
        });

        const savedPrediction = savedPredictions[0];

        // Mark reading as processed
        await markReadingAsProcessedService(reading.readingId);

        console.log(`✓ Successfully processed reading ${reading.readingId}`);
        
        return {
            success: true,
            readingId: reading.readingId,
            predictionId: savedPrediction?.predictionId
        };
    } catch (error: any) {
        console.error(`✗ Failed to process reading ${reading.readingId}:`, error.message);
        
        return {
            success: false,
            readingId: reading.readingId,
            error: error.message
        };
    }
}

/**
 * Process all unprocessed sensor readings
 * This is the main function that should be called periodically
 */
export async function processUnprocessedReadings(): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: ProcessResult[];
}> {
    console.log('=== Starting Background Processor ===');
    
    try {
        // Check ML API health first
        const health = await checkMLHealth();
        
        if (!health.data.binary_model_loaded || !health.data.failure_type_model_loaded) {
            throw new Error('ML API models are not loaded properly');
        }
        
        console.log('✓ ML API is healthy');
    } catch (error: any) {
        console.error('✗ ML API health check failed:', error.message);
        return {
            total: 0,
            successful: 0,
            failed: 0,
            results: []
        };
    }

    // Get all unprocessed readings
    const unprocessedReadings = await getUnprocessedReadingsService();
    console.log(`Found ${unprocessedReadings.length} unprocessed readings`);

    if (unprocessedReadings.length === 0) {
        console.log('No readings to process');
        return {
            total: 0,
            successful: 0,
            failed: 0,
            results: []
        };
    }

    // OPTIMIZED: Process each reading with configurable concurrency
    const results: ProcessResult[] = [];
    const BATCH_SIZE = 5; // Process 5 readings concurrently
    
    for (let i = 0; i < unprocessedReadings.length; i += BATCH_SIZE) {
        const batch = unprocessedReadings.slice(i, i + BATCH_SIZE);
        
        // Process batch concurrently
        const batchResults = await Promise.allSettled(
            batch.map(reading => processSingleReading(reading))
        );
        
        // Collect results
        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                console.error('Batch processing error:', result.reason);
                results.push({
                    success: false,
                    readingId: 'unknown',
                    error: result.reason?.message || 'Unknown error'
                });
            }
        }
        
        // Small delay between batches to avoid overwhelming ML API
        if (i + BATCH_SIZE < unprocessedReadings.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`=== Processing Complete ===`);
    console.log(`Total: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);

    return {
        total: results.length,
        successful,
        failed,
        results
    };
}
/**
 * Start the background processor with interval
 * @param intervalMinutes - How often to run the processor (in minutes)
 */
export function startBackgroundProcessor(intervalMinutes: number = 5) {
    console.log(`Starting background processor (interval: ${intervalMinutes} minutes)`);
    
    // Run immediately on start
    processUnprocessedReadings().catch(err => {
        console.error('Background processor error:', err);
    });
    
    // Convert minutes to cron expression
    // For every N minutes, we use: '*/N * * * *'
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    // Schedule the cron job
    cron.schedule(cronExpression, () => {
        processUnprocessedReadings().catch(err => {
            console.error('Background processor error:', err);
        });
    });
    
    console.log(`Background processor scheduled with expression: ${cronExpression}`);
}

/**
 * Manual trigger endpoint - for testing or manual processing
 */
export async function triggerManualProcessing() {
    console.log('Manual processing triggered');
    return await processUnprocessedReadings();
}
