import validateEmail from "deep-email-validator";

export async function isValidEmail(email: string): Promise<boolean> {
    const result = await validateEmail({
        email: email,
        validateMx: true,
        validateSMTP: true,
        validateRegex: true,
        validateDisposable: true
    });
    return result.valid;
}