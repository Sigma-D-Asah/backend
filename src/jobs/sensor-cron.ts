/**
 * Cron Jobs - Scheduled tasks
 * 
 * This module handles:
 * 1. Auto-generating sensor data for all active machines
 * 2. Can be configured to run at specific intervals (e.g., every 8 hours)
 */

import cron from 'node-cron';
import { getAllMachinesService } from '../services/machines.service';
import { generateRandomSensorDataService } from '../services/sensors.service';

/**
 * Generate sensor data for all active machines
 */
export async function generateSensorDataForAllMachines() {
    console.log('Cron Job: Generating Sensor Data');
    
    try {
        // Get all machines
        const machines = await getAllMachinesService();
        const activeMachines = machines.filter(m => m.status === 'ACTIVE');
        
        console.log(`Found ${activeMachines.length} active machines`);
        
        if (activeMachines.length === 0) {
            console.log('No active machines to generate data for');
            return {
                total: 0,
                successful: 0,
                failed: 0,
                results: []
            };
        }

        const results = [];
        
        for (const machine of activeMachines) {
            try {
                const readings = await generateRandomSensorDataService(machine.machineId);
                const reading = readings[0];
                console.log(`✓ Generated sensor data for ${machine.name} (${machine.code})`);
                
                results.push({
                    success: true,
                    machineId: machine.machineId,
                    machineName: machine.name,
                    readingId: reading?.readingId
                });
            } catch (error: any) {
                console.error(`✗ Failed to generate data for ${machine.name}:`, error.message);
                
                results.push({
                    success: false,
                    machineId: machine.machineId,
                    machineName: machine.name,
                    error: error.message
                });
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`Generation Completed:`);
        console.log(`Total: ${results.length}`);
        console.log(`Successful: ${successful}`);
        console.log(`Failed: ${failed}`);

        return {
            total: results.length,
            successful,
            failed,
            results
        };
    } catch (error: any) {
        console.error('Cron job error:', error.message);
        throw error;
    }
}
/**
 * Start cron job to generate sensor data at regular intervals
 * @param intervalHours - How often to generate data (in hours). Default: 1 hour (24x per day)
 */
export function startSensorDataCronJob(intervalHours: number = 1) {
    console.log(`Starting sensor data cron job (interval: ${intervalHours} hours)`);
    
    // Run immediately on start
    generateSensorDataForAllMachines().catch(err => {
        console.error('Cron job error:', err);
    });
    
    // Convert hours to cron expression
    // For every N hours, we use: '0 */N * * *'
    const cronExpression = `0 */${intervalHours} * * *`;
    
    // Schedule the cron job
    cron.schedule(cronExpression, () => {
        generateSensorDataForAllMachines().catch(err => {
            console.error('Cron job error:', err);
        });
    });
    
    console.log(`Cron job scheduled with expression: ${cronExpression}`);
}

/**
 * Manual trigger - for testing
 */
export async function triggerManualDataGeneration() {
    console.log('Manual data generation triggered');
    return await generateSensorDataForAllMachines();
}
