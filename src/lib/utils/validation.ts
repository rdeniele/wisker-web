export const validatePassword = (password: string): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    if (password.length < 7) {
        errors.push("Password must be at least 7 characters long.");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least 1 uppercase character");
    }

    if (!/(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
        errors.push('Password must contain at least 1 number and special character');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
