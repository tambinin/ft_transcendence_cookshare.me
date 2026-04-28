declare module 'deep-email-validator' {
    interface ValidatorOptions {
        email: string;
        sender?: string;
        validateRegex?: boolean;
        validateSMTP?: boolean;
        validateMx?: boolean;
        validateDisposable?: boolean;
        validateTypo?: boolean;
    }

    interface ValidatorResult {
        valid: boolean;
        reason?: string;
        validators: {
            [key: string]: {
                valid: boolean;
                reason?: string;
            };
        };
    }

    export default function validateEmail(
        options: ValidatorOptions | string): Promise<ValidatorResult>;
}