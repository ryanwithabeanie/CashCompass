import BudgetCard from '../BudgetCard';

function Budget({ user }) {
  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <BudgetCard user={user} />
    </div>
  );
}

export default Budget;
