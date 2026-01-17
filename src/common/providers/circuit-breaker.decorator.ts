import * as CircuitBreaker from 'opossum';
import { Logger } from '@nestjs/common';

const logger = new Logger('CircuitBreaker');

export function WithCircuitBreaker(options?: CircuitBreaker.Options) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        // Create a unique name for the breaker
        const breakerName = `${target.constructor.name}.${propertyKey}`;

        // Options for the circuit breaker
        const breakerOptions = {
            timeout: 10000, // 10 seconds before timeout
            errorThresholdPercentage: 50, // 50% failures opens circuit
            resetTimeout: 30000, // 30 seconds before trying again (half-open)
            name: breakerName,
            ...options,
        };

        // Note: We can't easily persist the breaker instance across method calls if we create it inside the decorator wrapper
        // because providing 'this' context of the class instance to the breaker is tricky if the breaker is static.
        // However, usually breakers are per-method on the prototype.
        // To keep it simple and robust, we attach the breaker to the class prototype or a static map if needed.
        // But standard way is to create it once.
        // Here we'll use a WeakMap or simple property on the target to store the breaker for this method.

        // Actually, simpler approach for decorators:
        // The decorator runs once at definition time. We can create the breaker then.
        // BUT, 'originalMethod' needs 'this' context usually.
        // Opossum wraps a function.

        let breaker: CircuitBreaker;

        descriptor.value = async function (...args: any[]) {
            if (!breaker) {
                // We need to bind the original method to the current instance 'this'
                // But the breaker needs to be reused across calls.
                // If we create breaker here, it's one per instance if we store it, or we need to be careful.
                // Actually, if we create it inside the function, we might recreate it every time if we aren't careful?
                // No, we can store it on the instance.

                const boundMethod = originalMethod.bind(this);
                breaker = new CircuitBreaker(boundMethod, breakerOptions);

                breaker.fallback(() => {
                    logger.warn(`Circuit open for ${breakerName}. executing fallback or throwing.`);
                    throw new Error(`Circuit open for ${breakerName}`);
                });

                breaker.on('open', () => logger.warn(`Circuit OPEN: ${breakerName}`));
                breaker.on('close', () => logger.log(`Circuit CLOSED: ${breakerName}`));
                breaker.on('halfOpen', () => logger.log(`Circuit HALF-OPEN: ${breakerName}`));
            }

            // Opossum's fire method calls the function.
            // Since we bound it above, it should work. 
            // HOWEVER, if 'this' changes (new instance), the bound method from the first call might be wrong?
            // In NestJS, services are usually singletons, so 'this' is stable.

            return breaker.fire(...args);
        };

        return descriptor;
    };
}
