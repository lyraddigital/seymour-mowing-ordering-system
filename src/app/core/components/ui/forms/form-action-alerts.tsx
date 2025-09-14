import { Alert, Box } from "@mui/material";

import { FormActionState, ValidationResultErrors } from "@/app/core/types";

type FormActionAlertsProps<T> = {    
    state?: FormActionState<T>;
};

export default function FormActionAlerts<T>({ state }: FormActionAlertsProps<T>) {
    const hasError = !!state?.error;
    const isServerError = hasError && typeof state.error === 'string';
    const isValidationError = hasError && !isServerError;
    const serverErrorMessage = isServerError ? state.error as string : undefined;
    const validationErrors = isValidationError ? (state.error as ValidationResultErrors).messages : undefined;

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
