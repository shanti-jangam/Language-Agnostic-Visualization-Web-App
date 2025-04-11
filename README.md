# Language Agnostic Visualization Web Application

## Project Overview
This web application provides a unified platform for creating data visualizations using either Python or R programming languages. Users can write and execute visualization code directly in the browser, making it easy to generate both static, interactive and 3D plots without switching between different environments.

The application features a modern, user-friendly interface with a built-in code editor that supports syntax highlighting for both Python and R. Users can seamlessly switch between languages and visualization types (static, interactive, or 3D) while maintaining a consistent workflow. The backend handles the code execution in isolated environments, ensuring security while providing the full capabilities of popular visualization libraries like Matplotlib, Plotly, and ggplot2.

Key capabilities include:
- Write and execute Python or R code in real-time
- Generate static, interactive, and 3D visualizations
- Switch between programming languages seamlessly
- Immediate visualization preview
- Secure code execution environment

## Overview of Design and Tools

### Frontend
- **React** with TypeScript for the main application framework
- **Material-UI (MUI)** for modern, responsive UI components
- **Monaco Editor** for code editing with syntax highlighting
- **Axios** for API communication

### Backend
- **FastAPI** for the Python backend server
- **rpy2** for R integration
- **Python Libraries**: Matplotlib, Plotly, NumPy, Pandas
- **R Libraries**: ggplot2, plotly

## Issues Encountered and Resolutions

1. **R Integration Challenges**
   - **Issue**: Initial difficulties with R visualizations not displaying properly while Python visualizations worked fine
   - **Resolution**: Implemented proper rpy2 integration and ensured correct environment setup for R

2. **Visualization Display**
   - **Issue**: Interactive visualizations weren't rendering correctly in iframes
   - **Resolution**: Implemented proper iframe handling with appropriate sandbox permissions and sizing

## Demo Visualizations

### Python Examples
1. Static Visualization:
```python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', label='sin(x)')
plt.title('Static Plot Example')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.legend()
```

2. Interactive Visualization:
```python
import numpy as np
import plotly.express as px

x = np.linspace(0, 10, 100)
y = np.sin(x)

fig = px.line(x=x, y=y, title='Interactive Plot Example')
fig.update_layout(
    xaxis_title='x',
    yaxis_title='sin(x)',
    showlegend=True
)
```

### R Examples
1. Static Visualization:
```r
x <- seq(0, 10, length.out = 100)
y <- sin(x)
df <- data.frame(x = x, y = y)

p <- ggplot(df, aes(x = x, y = y)) +
  geom_line(color = "blue") +
  labs(title = "Static Plot Example",
       x = "x",
       y = "sin(x)") +
  theme_minimal()
```

2. Interactive Visualization:
```r
library(plotly)

x <- seq(-5, 5, length.out = 50)
y <- seq(-5, 5, length.out = 50)
grid <- expand.grid(x = x, y = y)
grid$z <- sin(sqrt(grid$x^2 + grid$y^2))

p <- plot_ly(type = 'surface',
            x = x,
            y = y,
            z = matrix(grid$z, nrow = 50, ncol = 50),
            colorscale = 'Viridis')
```

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd language-agnostic-visualization
```

2. Backend Setup:
```bash
cd backend
python -m venv venv
source venv/bin/activate  
pip install -r requirements.txt
```

3. Frontend Setup:
```bash
cd frontend
npm install
```

4. Start the application:
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm start
```

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Demo Video
https://www.youtube.com/watch?v=W0tctNQXQ3w

## Prerequisites
- Python 3.8+
- R 4.0+
- Node.js 14+
- npm 6+


## Supported Visualization Libraries

### Python
- Matplotlib (static plots)
- Plotly (interactive plots)
- NumPy (data manipulation)
- Pandas (data handling)

### R
- ggplot2 (static plots)
- plotly (interactive plots)


## Usage

1. Select the desired programming language (Python or R)
2. Write or paste your visualization code in the editor
3. Click "Generate Visualization" to execute the code
4. View the resulting visualization below the editor

## Author
Shanti Jangam
