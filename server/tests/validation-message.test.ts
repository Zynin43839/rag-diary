import { describe, test, expect } from 'bun:test';
import { describeValidation } from '../src/lib/validation-message';

describe('describeValidation', () => {
    test('formats a field and message', () => {
        const raw = JSON.stringify({
            type: 'validation',
            property: '/password',
            message: 'Expected string',
        });
        expect(describeValidation(raw)).toBe('Invalid password: Expected string');
    });

    test('returns the message when there is no field', () => {
        expect(describeValidation(JSON.stringify({ message: 'Body is required' }))).toBe(
            'Body is required'
        );
    });

    test('falls back to "invalid value" when the message is missing', () => {
        expect(describeValidation(JSON.stringify({ property: '/email' }))).toBe(
            'Invalid email: invalid value'
        );
    });

    test('returns the raw text when it is not JSON', () => {
        expect(describeValidation('not json')).toBe('not json');
    });
});
