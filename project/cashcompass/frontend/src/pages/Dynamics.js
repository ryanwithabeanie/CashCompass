import { Pie, Line } from 'react-chartjs-2';
import { marked } from 'marked';

function Dynamics({ 
  summary, 
  summaryLoading, 
  summaryError, 
  isGeneratingSummary, 
  generateNewSummary, 
  pieData, 
  lineData 
}) {
  return (
    <div style={{ width: '100%' }}>
      {/* Summary Section with Generate Button */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        marginBottom: '2rem',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0', color: '#222', textAlign: 'left', fontSize: '1.5rem', fontWeight: '600', userSelect: 'none' }}>Weekly Summary</h2>
          <button
            onClick={generateNewSummary}
            disabled={summaryLoading || isGeneratingSummary}
            style={{
              background: (summaryLoading || isGeneratingSummary) 
                ? "rgba(52, 152, 219, 0.1)" 
                : 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
              color: (summaryLoading || isGeneratingSummary) ? "#222" : "#fff",
              border: "1px solid rgba(52, 152, 219, 0.2)",
              padding: "0.7rem 1.5rem",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor: summaryLoading || isGeneratingSummary ? "not-allowed" : "pointer",
              opacity: summaryLoading || isGeneratingSummary ? 0.7 : 1,
              transition: "all 0.2s",
              backdropFilter: "blur(8px)"
            }}
          >
            {summaryLoading ? "Generating..." : summary ? "Generate Another Summary" : "Generate Summary"}
          </button>
        </div>

        {summaryLoading && (
          <div style={{
            padding: '1rem',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            Generating Summary...
          </div>
        )}
        
        {summaryError && (
          <div style={{
            backgroundColor: '#fff3f3',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #ffcccc',
            color: '#cc0000',
            fontStyle: 'italic',
            marginBottom: '1rem'
          }}>
            {summaryError}
          </div>
        )}
        
        {summary && !summaryLoading && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            position: 'relative',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ userSelect: 'none' }}>This Week</h3>
                <p style={{ userSelect: 'none' }}><strong>Income:</strong> ${summary.currentWeek?.income ?? 0}</p>
                <p style={{ userSelect: 'none' }}><strong>Expense:</strong> ${summary.currentWeek?.expense ?? 0}</p>
                <p style={{ userSelect: 'none' }}><strong>Savings:</strong> ${summary.currentWeek?.savings ?? 0}</p>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ userSelect: 'none' }}>Last Week</h3>
                <p style={{ userSelect: 'none' }}><strong>Income:</strong> ${summary.previousWeek?.income ?? 0}</p>
                <p style={{ userSelect: 'none' }}><strong>Expense:</strong> ${summary.previousWeek?.expense ?? 0}</p>
                <p style={{ userSelect: 'none' }}><strong>Savings:</strong> ${summary.previousWeek?.savings ?? 0}</p>
              </div>
            </div>
            {/* AI Insight */}
            {summary.aiComment && (
              <div
                style={{
                  marginTop: '1.5rem',
                  backgroundColor: '#f6f8fa',
                  padding: '1rem',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  color: '#333',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                }}
                dangerouslySetInnerHTML={{
                  __html: marked(summary.aiComment),
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Charts Section */}
      {summary && !summaryLoading && (
        <div style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {/* Pie Chart */}
          <div style={{
            flex: '1 1 320px',
            minWidth: 320,
            maxWidth: 400,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(12px)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ color: '#222', marginBottom: '1rem', textAlign: 'left', fontSize: '1.2rem', fontWeight: '600', userSelect: 'none' }}>Pie Chart</h3>
            <div style={{ width: 300, height: 300 }}>
              <Pie
                data={pieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
          {/* Line Chart */}
          <div style={{
            flex: '1 1 420px',
            minWidth: 320,
            maxWidth: 500,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(12px)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ color: '#222', marginBottom: '1rem', textAlign: 'left', fontSize: '1.2rem', fontWeight: '600', userSelect: 'none' }}>Linear Graph</h3>
            <div style={{ width: 400, height: 300 }}>
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                  },
                  scales: {
                    x: { title: { display: true, text: 'Week' } },
                    y: { title: { display: true, text: 'Amount ($)' }, beginAtZero: true }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dynamics;
