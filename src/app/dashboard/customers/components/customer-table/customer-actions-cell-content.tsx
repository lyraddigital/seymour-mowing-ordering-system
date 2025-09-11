import { Grid, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

type CustomerActionsCellContentProps = {    
    onDeletePressed: () => void;
    onViewPressed: () => void;
};

export default function CustomerActionsCellContent({ onDeletePressed, onViewPressed }: CustomerActionsCellContentProps) {
    return (
        <Grid container justifyContent="flex-end" spacing={1}>
            <Grid container>
                <IconButton color="inherit" size="small" onClick={() => onViewPressed()}>
                    <VisibilityIcon sx={{ opacity: 0.6 }} />
                </IconButton>
            </Grid>
            <Grid container>
                <IconButton color="inherit" size="small" onClick={() => onDeletePressed()}>
                    <DeleteIcon sx={{ opacity: 0.6 }} />
                </IconButton>
            </Grid>
        </Grid>
    );
}