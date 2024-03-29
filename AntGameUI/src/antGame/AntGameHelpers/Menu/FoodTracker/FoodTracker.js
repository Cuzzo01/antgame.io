import "./FoodTracker.css";

const FoodTracker = ({ DisplayScore, foodReturned, styles, active }) => {
  let roundedFoodReturned = Math.round(foodReturned * 1000) / 10;

  let displayAmount = "";
  if (DisplayScore) {
    displayAmount = Math.round(foodReturned * 100000);
  } else {
    if (roundedFoodReturned === 0) displayAmount = "00.0";
    else if (roundedFoodReturned === 100 && foodReturned < 1) displayAmount = "99.9";
    else {
      if (roundedFoodReturned < 10) displayAmount += "0";
      displayAmount += roundedFoodReturned;
      if (Number.isInteger(roundedFoodReturned)) displayAmount += ".0";
    }
    displayAmount += "%";
  }

  return (
    <div style={styles}>
      <h2 className={`tracker ${active ? "active" : ""}`}>{displayAmount}</h2>
    </div>
  );
};

export default FoodTracker;
