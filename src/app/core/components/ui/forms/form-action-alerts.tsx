import { Alert, Box } from "@mui/material";

import { ValidationResultErrors } from "@/app/core/types";

type FormActionAlertsProps<T> = {    
    error: string | ValidationResultErrors | undefined;
};

export default function FormActionAlerts<T>({ error }: FormActionAlertsProps<T>) {
    const hasError = !!error;
    const isServerError = hasError && typeof error === 'string';
    const isValidationError = hasError && !isServerError;
    const serverErrorMessage = isServerError ? error as string : undefined;
    const validationErrors = isValidationError ? (error as ValidationResultErrors).messages : undefined;

    return (
        <>
            {isServerError && <Alert severity="error" sx={{ mb: 3 }}>
                { serverErrorMessage }
            </Alert>}
            {validationErrors && <Alert severity="error" sx={{ mb: 3 }}>
                <Box sx={{ mb: 1 }}>Could not submit form. Please address the following issues.</Box>
                <Box component="ul" sx={{ m: 0 }}>
                    {validationErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                    ))}
                </Box>
            </Alert>}
        </>
    );
}
