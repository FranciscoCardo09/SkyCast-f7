import { Box, Typography, Grid, Paper } from "@mui/material"

const WRFSection = () => {
  // Dummy data for WRF information
  const wrfData = [
    {
      title: "Temperatura",
      value: "25°C",
      unit: "",
    },
    {
      title: "Humedad",
      value: "60",
      unit: "%",
    },
    {
      title: "Viento",
      value: "15",
      unit: " km/h",
    },
    {
      title: "Precipitación",
      value: "0",
      unit: " mm",
    },
  ]

  return (
    <Box sx={{ mt: 3, bgcolor: "background.paper", p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Pronóstico del Tiempo
      </Typography>
      <Grid container spacing={2}>
        {wrfData.map((item, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="subtitle1">{item.title}</Typography>
              <Typography variant="h5">
                {item.value} {item.unit}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default WRFSection
