export const validateNotEmpty = (value: string, fieldName: string): void => {
    if(!value || value.trim() === '') {
        throw new Error(`${fieldName} cannot be empty`);
    }
};

export const vaslidateUUID = (value: string, fieldName: string): void => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if(!value || !uuidRegex.test(value)) {
        throw new Error(`Inalid UUID format`);
    }
};