import rpy2.robjects as robjects

# Test R code
r_code = '''
library(ggplot2)
print("R is working!")
'''

# Execute R code
robjects.r(r_code) 