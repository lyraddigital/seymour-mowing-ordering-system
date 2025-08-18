import { Alert, Box } from "@mui/material";

import { FormActionState } from "@/app/core/validators";

type FormActionAlertsProps<T> = {    
    state?: FormActionState<T>;
};

export default function FormActionAlerts<T>({ state }: FormActionAlertsProps<T>) {
    const isServerError = !!state?.hasServerError;
    const hasValidationErrorMessages = !!state?.validationResult?.errors?.messages;    

    return (
        <>
            {isServerError && <Alert severity="error" sx={{ mb: 3 }}>
                { state?.serverErrorMessage }
            </Alert>}
            {hasValidationErrorMessages && <Alert severity="error" sx={{ mb: 3 }}>
                <Box sx={{ mb: 1 }}>Could not submit form. Please address the following issues.</Box>
                <Box component="ul" sx={{ m: 0 }}>
                    {state?.validationResult?.errors?.messages.map((m, i) => (
                        <li key={i}>{m}</li>
                    ))}
                </Box>
            </Alert>}
        </>
    );
}
