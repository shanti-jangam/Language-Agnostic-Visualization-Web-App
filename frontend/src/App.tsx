import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import VisualizationEditor from './components/VisualizationEditor';
import './App.css';

function App() {
  return (
    <div className="App">
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Language Agnostic Visualization
          </Typography>
          <Paper elevation={3} sx={{ p: 3 }}>
            <VisualizationEditor />
          </Paper>
        </Box>
      </Container>
    </div>
  );
}

export default App;
