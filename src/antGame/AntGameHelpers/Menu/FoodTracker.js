const FoodTracker = (props) => {
  let roundedFoodReturned = Math.round(props.foodReturned * 1000) / 10;

  let displayAmount = "";
  if (roundedFoodReturned === 0) displayAmount = "00.0";
  else {
    if (roundedFoodReturned < 10) displayAmount += "0";
    displayAmount += roundedFoodReturned;
    if (Number.isInteger(roundedFoodReturned)) displayAmount += ".0";
  }

  return (
    <div style={props.styles}>
      <h3 style={props.active ? styles.active : null}>{displayAmount}%</h3>
    </div>
  );
};

const styles = {
  active: {
    color: "green",
  },
};
export default FoodTracker;
