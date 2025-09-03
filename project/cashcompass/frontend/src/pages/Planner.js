import WeeklyPlannerCard from '../WeeklyPlannerCard';

function Planner({ user }) {
  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <WeeklyPlannerCard user={user} />
    </div>
  );
}

export default Planner;
