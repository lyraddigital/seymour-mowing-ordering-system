import { Avatar, Grid } from "@mui/material";

import { Customer } from "@/app/core/data/models";

type CustomerCellContentProps = {
  customer: Customer;
};

export default function CustomerNameCellContent({ customer }: CustomerCellContentProps) {  
  return (
    <Grid container gap={3} flexWrap="nowrap">
        <Avatar sx={{
            width: 40,
            height: 40,
            bgcolor: "secondary.main",
            color: "secondary.contrastText",
        }}>
            { !customer.profilePicUrl ? <img src={"https://pbs.twimg.com/profile_images/884488953725947905/Uef29ZQc_400x400.jpg"} alt="Profile" style={{ width: 40, height: 40, borderRadius: "50%" }} /> : "S" }
        </Avatar>
        <Grid container direction="column">
            <Grid>
                {customer.customerName}
            </Grid>
            <Grid>
                {customer.contactEmail}
            </Grid>
        </Grid>
    </Grid>
  );
}
