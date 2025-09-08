import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Page configuration
st.set_page_config(
    page_title="Patient Health Trend Analysis Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 10px;
        border-left: 5px solid #1f77b4;
    }
    .insight-box {
        background-color: #e8f4fd;
        padding: 1.5rem;
        border-radius: 10px;
        border: 1px solid #1f77b4;
        margin-top: 1rem;
    }
    .warning-box {
        background-color: #fff3cd;
        padding: 1.5rem;
        border-radius: 10px;
        border: 1px solid #ffc107;
        margin-top: 1rem;
    }
    .success-box {
        background-color: #d4edda;
        padding: 1.5rem;
        border-radius: 10px;
        border: 1px solid #28a745;
        margin-top: 1rem;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data():
    """Load and process the CSV files"""
    try:
        # Load patient data (past 180 days)
        patient_data = pd.read_csv('data/patient_180days_hourly.csv')
        
        # Load prediction data (next 90 days)
        prediction_data = pd.read_csv('data/Prediction_with_StressIndex.csv')
        
        # Convert datetime columns
        if 'datetime' in patient_data.columns:
            patient_data['datetime'] = pd.to_datetime(patient_data['datetime'])
        elif 'date' in patient_data.columns:
            patient_data['datetime'] = pd.to_datetime(patient_data['date'])
        else:
            # Create datetime from index if not present
            patient_data['datetime'] = pd.date_range(
                start=datetime.now() - timedelta(days=180),
                periods=len(patient_data),
                freq='H'
            )
        
        if 'datetime' in prediction_data.columns:
            prediction_data['datetime'] = pd.to_datetime(prediction_data['datetime'])
        elif 'date' in prediction_data.columns:
            prediction_data['datetime'] = pd.to_datetime(prediction_data['date'])
        else:
            # Create datetime starting from last patient data point
            last_date = patient_data['datetime'].max()
            prediction_data['datetime'] = pd.date_range(
                start=last_date + timedelta(hours=1),
                periods=len(prediction_data),
                freq='H'
            )
        
        # Add data type identifier
        patient_data['data_type'] = 'Historical'
        prediction_data['data_type'] = 'Predicted'
        
        # Combine datasets
        combined_data = pd.concat([patient_data, prediction_data], ignore_index=True)
        combined_data = combined_data.sort_values('datetime').reset_index(drop=True)
        
        return patient_data, prediction_data, combined_data
        
    except Exception as e:
        st.error(f"Error loading data: {str(e)}")
        # Create sample data for demonstration
        dates_past = pd.date_range(start=datetime.now() - timedelta(days=180), periods=180*24, freq='H')
        dates_future = pd.date_range(start=datetime.now(), periods=90*24, freq='H')
        
        np.random.seed(42)
        patient_data = pd.DataFrame({
            'datetime': dates_past,
            'StressIndex': np.random.normal(50, 15, len(dates_past)).clip(0, 100),
            'HeartRate': np.random.normal(75, 10, len(dates_past)).clip(50, 120),
            'SystolicBP': np.random.normal(120, 15, len(dates_past)).clip(90, 180),
            'DiastolicBP': np.random.normal(80, 10, len(dates_past)).clip(60, 120),
            'data_type': 'Historical'
        })
        
        prediction_data = pd.DataFrame({
            'datetime': dates_future,
            'StressIndex': np.random.normal(55, 12, len(dates_future)).clip(0, 100),
            'HeartRate': np.random.normal(78, 8, len(dates_future)).clip(50, 120),
            'SystolicBP': np.random.normal(125, 12, len(dates_future)).clip(90, 180),
            'DiastolicBP': np.random.normal(82, 8, len(dates_future)).clip(60, 120),
            'data_type': 'Predicted'
        })
        
        combined_data = pd.concat([patient_data, prediction_data], ignore_index=True)
        
        return patient_data, prediction_data, combined_data

def generate_insights(data, attribute, data_type_filter):
    """Generate automatic insights based on trends"""
    insights = []
    
    if data_type_filter == "Both" and len(data[data['data_type'] == 'Historical']) > 0 and len(data[data['data_type'] == 'Predicted']) > 0:
        # Compare historical vs predicted
        hist_mean = data[data['data_type'] == 'Historical'][attribute].mean()
        pred_mean = data[data['data_type'] == 'Predicted'][attribute].mean()
        
        change_pct = ((pred_mean - hist_mean) / hist_mean) * 100
        
        if change_pct > 10:
            insights.append(f"⚠️ **{attribute}** is projected to increase by {change_pct:.1f}%. Preventive measures recommended.")
        elif change_pct < -10:
            insights.append(f"✅ **{attribute}** shows signs of improvement with a projected decrease of {abs(change_pct):.1f}%.")
        else:
            insights.append(f"ℹ️ **{attribute}** remains relatively stable with minor fluctuations ({change_pct:+.1f}%).")
    
    # Trend analysis
    if len(data) > 1:
        recent_trend = np.polyfit(range(len(data)), data[attribute], 1)[0]
        
        if recent_trend > 0:
            insights.append(f"📈 **Trend Analysis**: {attribute} shows an upward trend over the selected period.")
        elif recent_trend < 0:
            insights.append(f"📉 **Trend Analysis**: {attribute} shows a downward trend over the selected period.")
        else:
            insights.append(f"➡️ **Trend Analysis**: {attribute} shows a stable trend over the selected period.")
    
    # Statistical insights
    std_dev = data[attribute].std()
    mean_val = data[attribute].mean()
    cv = (std_dev / mean_val) * 100 if mean_val != 0 else 0
    
    if cv > 20:
        insights.append(f"📊 **Variability**: High variability detected in {attribute} (CV: {cv:.1f}%). Consider monitoring more closely.")
    elif cv < 10:
        insights.append(f"📊 **Variability**: Low variability in {attribute} (CV: {cv:.1f}%). Values are relatively consistent.")
    else:
        insights.append(f"📊 **Variability**: Moderate variability in {attribute} (CV: {cv:.1f}%).")
    
    return insights

def create_main_chart(data, attribute, data_type_filter):
    """Create the main time series chart"""
    fig = go.Figure()
    
    if data_type_filter in ["Historical", "Both"]:
        hist_data = data[data['data_type'] == 'Historical']
        if not hist_data.empty:
            fig.add_trace(go.Scatter(
                x=hist_data['datetime'],
                y=hist_data[attribute],
                mode='lines',
                name='Historical Data',
                line=dict(color='#1f77b4', width=2),
                hovertemplate=f'<b>Historical</b><br>Date: %{{x}}<br>{attribute}: %{{y:.2f}}<extra></extra>'
            ))
    
    if data_type_filter in ["Predicted", "Both"]:
        pred_data = data[data['data_type'] == 'Predicted']
        if not pred_data.empty:
            fig.add_trace(go.Scatter(
                x=pred_data['datetime'],
                y=pred_data[attribute],
                mode='lines',
                name='Predicted Data',
                line=dict(color='#ff7f0e', width=2, dash='dash'),
                hovertemplate=f'<b>Predicted</b><br>Date: %{{x}}<br>{attribute}: %{{y:.2f}}<extra></extra>'
            ))
    
    fig.update_layout(
        title=f'{attribute} Trend Analysis',
        xaxis_title='Date/Time',
        yaxis_title=attribute,
        hovermode='x unified',
        template='plotly_white',
        height=500,
        showlegend=True
    )
    
    return fig

def create_distribution_chart(data, attribute):
    """Create distribution charts"""
    fig = make_subplots(
        rows=1, cols=2,
        subplot_titles=['Distribution Histogram', 'Box Plot Comparison'],
        specs=[[{"secondary_y": False}, {"secondary_y": False}]]
    )
    
    # Histogram
    for data_type in data['data_type'].unique():
        subset = data[data['data_type'] == data_type]
        color = '#1f77b4' if data_type == 'Historical' else '#ff7f0e'
        
        fig.add_trace(
            go.Histogram(
                x=subset[attribute],
                name=f'{data_type}',
                opacity=0.7,
                marker_color=color,
                nbinsx=30
            ),
            row=1, col=1
        )
    
    # Box plot
    for data_type in data['data_type'].unique():
        subset = data[data['data_type'] == data_type]
        color = '#1f77b4' if data_type == 'Historical' else '#ff7f0e'
        
        fig.add_trace(
            go.Box(
                y=subset[attribute],
                name=f'{data_type}',
                marker_color=color,
                boxpoints='outliers'
            ),
            row=1, col=2
        )
    
    fig.update_layout(
        title=f'{attribute} Distribution Analysis',
        template='plotly_white',
        height=400,
        showlegend=True
    )
    
    return fig

def main():
    # Header
    st.markdown('<h1 class="main-header">📊 Patient Health Trend Analysis Dashboard</h1>', unsafe_allow_html=True)
    
    # Load data
    with st.spinner('Loading data...'):
        patient_data, prediction_data, combined_data = load_data()
    
    # Sidebar filters
    st.sidebar.header("🔧 Dashboard Controls")
    
    # Get available attributes (numeric columns excluding datetime and data_type)
    numeric_columns = combined_data.select_dtypes(include=[np.number]).columns.tolist()
    if 'datetime' in numeric_columns:
        numeric_columns.remove('datetime')
    
    # Attribute selector
    selected_attribute = st.sidebar.selectbox(
        "📈 Select Attribute",
        options=numeric_columns,
        index=0 if numeric_columns else None
    )
    
    # Data type filter
    data_type_filter = st.sidebar.radio(
        "📊 Data Type",
        options=["Both", "Historical", "Predicted"],
        index=0
    )
    
    # Date range filter
    min_date = combined_data['datetime'].min().date()
    max_date = combined_data['datetime'].max().date()
    
    date_range = st.sidebar.date_input(
        "📅 Select Date Range",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date
    )
    
    # Filter data based on selections
    if len(date_range) == 2:
        start_date, end_date = date_range
        filtered_data = combined_data[
            (combined_data['datetime'].dt.date >= start_date) &
            (combined_data['datetime'].dt.date <= end_date)
        ]
    else:
        filtered_data = combined_data
    
    # Apply data type filter
    if data_type_filter != "Both":
        filtered_data = filtered_data[filtered_data['data_type'] == data_type_filter]
    
    # Main dashboard
    if not filtered_data.empty and selected_attribute:
        # Key metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.markdown('<div class="metric-card">', unsafe_allow_html=True)
            st.metric(
                label=f"Average {selected_attribute}",
                value=f"{filtered_data[selected_attribute].mean():.2f}",
                delta=f"{filtered_data[selected_attribute].std():.2f} (std)"
            )
            st.markdown('</div>', unsafe_allow_html=True)
        
        with col2:
            st.markdown('<div class="metric-card">', unsafe_allow_html=True)
            st.metric(
                label=f"Max {selected_attribute}",
                value=f"{filtered_data[selected_attribute].max():.2f}",
                delta=f"{filtered_data[selected_attribute].min():.2f} (min)"
            )
            st.markdown('</div>', unsafe_allow_html=True)
        
        with col3:
            st.markdown('<div class="metric-card">', unsafe_allow_html=True)
            total_records = len(filtered_data)
            hist_records = len(filtered_data[filtered_data['data_type'] == 'Historical']) if 'Historical' in filtered_data['data_type'].values else 0
            st.metric(
                label="Total Records",
                value=f"{total_records:,}",
                delta=f"{hist_records:,} historical"
            )
            st.markdown('</div>', unsafe_allow_html=True)
        
        with col4:
            st.markdown('<div class="metric-card">', unsafe_allow_html=True)
            date_span = (filtered_data['datetime'].max() - filtered_data['datetime'].min()).days
            st.metric(
                label="Date Span",
                value=f"{date_span} days",
                delta=f"{len(filtered_data['data_type'].unique())} data types"
            )
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Main chart
        st.subheader(f"📈 {selected_attribute} Time Series Analysis")
        main_chart = create_main_chart(filtered_data, selected_attribute, data_type_filter)
        st.plotly_chart(main_chart, use_container_width=True)
        
        # Secondary charts
        st.subheader(f"📊 {selected_attribute} Distribution Analysis")
        dist_chart = create_distribution_chart(filtered_data, selected_attribute)
        st.plotly_chart(dist_chart, use_container_width=True)
        
        # Insights section
        st.subheader("🔍 Automated Insights & Recommendations")
        insights = generate_insights(filtered_data, selected_attribute, data_type_filter)
        
        for i, insight in enumerate(insights):
            if "⚠️" in insight:
                st.markdown(f'<div class="warning-box">{insight}</div>', unsafe_allow_html=True)
            elif "✅" in insight:
                st.markdown(f'<div class="success-box">{insight}</div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<div class="insight-box">{insight}</div>', unsafe_allow_html=True)
        
        # Data summary table
        with st.expander("📋 Data Summary"):
            summary_stats = filtered_data.groupby('data_type')[selected_attribute].agg([
                'count', 'mean', 'std', 'min', 'max', 'median'
            ]).round(2)
            st.dataframe(summary_stats, use_container_width=True)
    
    else:
        st.warning("No data available for the selected filters. Please adjust your selection.")
    
    # Footer
    st.markdown("---")
    st.markdown("**Dashboard Info:** This interactive dashboard analyzes patient health trends using historical and predicted data.")

if __name__ == "__main__":
    main()