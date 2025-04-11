from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import tempfile
import os
import base64
from pathlib import Path
import uuid
import json
from typing import Dict, Any
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScriptRequest(BaseModel):
    language: str
    code: str
    viz_type: str = "static"  

PYTHON_IMPORTS = """
import matplotlib.pyplot as plt
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
import pandas as pd
"""

R_IMPORTS = """
library(ggplot2)
library(plotly)
library(htmlwidgets)
"""

STATIC_MATPLOTLIB_TEMPLATE = """
# Save matplotlib plots if they exist
if 'plt' in locals() and plt.get_fignums():
    plt.savefig('output.png')
    plt.close()
"""

INTERACTIVE_PLOTLY_TEMPLATE = """
# Save plotly figure if it exists
if 'fig' in locals():
    fig.write_html('output.html')
"""

SAMPLE_CODES = {
    "python": {
        "static": """import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', label='sin(x)')
plt.title('Static Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.grid(True)
plt.legend()
plt.savefig('static_plot.png')
plt.close()""",
        
        "interactive": """import plotly.graph_objects as go
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=x, 
    y=y,
    mode='lines',
    name='sin(x)',
    line=dict(color='blue', width=2)
))

fig.update_layout(
    title='Interactive Sine Wave',
    xaxis_title='x',
    yaxis_title='sin(x)',
    template='plotly_white'
)

fig.write_html('interactive_plot.html')""",

        "3d": """import plotly.graph_objects as go
import numpy as np

# Create the 3D data
x = np.linspace(-5, 5, 50)
y = np.linspace(-5, 5, 50)
X, Y = np.meshgrid(x, y)
Z = np.sin(np.sqrt(X**2 + Y**2))

# Create the 3D surface plot
fig = go.Figure(data=[go.Surface(x=X, y=Y, z=Z)])

fig.update_layout(
    title='3D Surface Plot',
    scene=dict(
        xaxis_title='X',
        yaxis_title='Y',
        zaxis_title='Z'
    ),
    width=800,
    height=800
)

fig.write_html('3d_plot.html')"""
    },
}

@app.get("/")
async def read_root():
    return {"message": "Visualization API is running"}

@app.post("/generate-visualization")
async def generate_visualization(request: ScriptRequest):
    try:
        if request.language.lower() == "python":
            return await handle_python_script(request.code, request.viz_type)
        elif request.language.lower() == "r":
            return await handle_r_script(request.code, request.viz_type)
        else:
            raise HTTPException(status_code=400, detail="Unsupported language")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def handle_python_script(code: str, viz_type: str):
    with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as f:
        f.write(PYTHON_IMPORTS + "\n")
        
        if viz_type == "interactive" or viz_type == "3d":
            f.write(code + "\n")
            f.write("\nfig.write_html('output.html')\n")
            output_file = "output.html"
        else: 
            f.write(code + "\n")
            f.write("\nplt.savefig('output.png')\n")
            output_file = "output.png"
            
        f.flush()
        
        result = subprocess.run(['python', f.name], capture_output=True, text=True)
        os.unlink(f.name)
        
        if result.returncode != 0:
            raise Exception(f"Error executing Python script: {result.stderr}")
        
        if os.path.exists(output_file):
            with open(output_file, 'rb') as out_file:
                content = out_file.read()
                os.unlink(output_file)
                if viz_type == "interactive" or viz_type == "3d":
                    return {"type": "html", "content": content.decode('utf-8')}
                else:
                    return {"type": "image", "content": base64.b64encode(content).decode('utf-8')}
        else:
            raise Exception("No output file generated")

async def handle_r_script(code: str, viz_type: str):
    with tempfile.NamedTemporaryFile(suffix='.R', mode='w', delete=False) as f:
        f.write(R_IMPORTS + "\n")
        
        if viz_type == "interactive" or viz_type == "3d":
            f.write(code + "\n")
            # Create a unique output directory
            output_dir = os.path.join(tempfile.gettempdir(), str(uuid.uuid4()))
            os.makedirs(output_dir, exist_ok=True)
            output_file = os.path.join(output_dir, 'output.html')
            
           
            f.write(f"""
            # Save the widget
            htmlwidgets::saveWidget(
                widget = p,
                file = '{output_file}',
                selfcontained = TRUE
            )
            """)
        else: 
            f.write(code + "\n")
            output_dir = os.path.join(tempfile.gettempdir(), str(uuid.uuid4()))
            os.makedirs(output_dir, exist_ok=True)
            output_file = os.path.join(output_dir, 'output.png')
            f.write(f"\nggsave('{output_file}', plot = p, width = 10, height = 6)\n")
            
        f.flush()
        
        result = subprocess.run(['Rscript', f.name], capture_output=True, text=True)
        os.unlink(f.name)
        
        if result.returncode != 0:
            if os.path.exists(output_dir):
                shutil.rmtree(output_dir)
            print(f"R Error: {result.stderr}")  # Add this line for debugging
            raise Exception(f"Error executing R script: {result.stderr}")
        
        if os.path.exists(output_file):
            with open(output_file, 'rb') as out_file:
                content = out_file.read()
                if os.path.exists(output_dir):
                    shutil.rmtree(output_dir)
                if viz_type == "interactive" or viz_type == "3d":
                    html_content = content.decode('utf-8')
                    return {"type": "html", "content": html_content}
                else:
                    return {"type": "image", "content": base64.b64encode(content).decode('utf-8')}
        else:
            if os.path.exists(output_dir):
                shutil.rmtree(output_dir)
            raise Exception("No output file generated")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 