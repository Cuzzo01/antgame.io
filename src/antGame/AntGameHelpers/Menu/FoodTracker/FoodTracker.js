import "./FoodTracker.css";

const FoodTracker = (props) => {
  let roundedFoodReturned = Math.round(props.foodReturned * 1000) / 10;

  let displayAmount = "";
  if (roundedFoodReturned === 0) displayAmount = "00.0";
  else if (roundedFoodReturned === 100 && props.foodReturned < 1)
    displayAmount = "99.9";
  else {
    if (roundedFoodReturned < 10) displayAmount += "0";
    displayAmount += roundedFoodReturned;
    if (Number.isInteger(roundedFoodReturned)) displayAmount += ".0";
  }

  return (
    <div style={props.styles}>
      {/* <h2 className={`tracker ${props.active ? "active" : ""}`}>
        {displayAmount}%
      </h2> */}
      <progress max="100" value={displayAmount} />
    </div>
  );
};

// const styles = {
//   active: {
//     color: "green",
//   },
// };
export default FoodTracker;
