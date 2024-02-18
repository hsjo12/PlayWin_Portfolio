String.prototype.replaceAt = function (index, replacement) {
  if (index >= this.length) {
    return this.valueOf();
  }

  return this.substring(0, index) + replacement + this.substring(index + 1);
};
const secondPlaceGenerator = (winningNumber) => {
  let variableNumber = String(winningNumber);
  let secondPlace = [];
  for (let i = 0; i < winningNumber.length; i++) {
    for (let j = 0; j < 10; j++) {
      variableNumber = variableNumber.replaceAt(i, j);
      if (Number(winningNumber) !== Number(variableNumber)) {
        secondPlace.push(variableNumber);
      }
    }
    variableNumber = winningNumber;
  }
  return secondPlace;
};

const thirdPlaceGenerator = (winningNumber) => {
  let thirdPlace = [];
  let variableNumber = winningNumber;
  let smallNumbers = 0;
  for (let i = 0; i < winningNumber.length; i++) {
    for (let k = i + 1; k < winningNumber.length; k++) {
      for (let j = 0; j < 100; j++) {
        if (String(j).length == 1) {
          smallNumbers = "0" + j;
        } else {
          smallNumbers = String(j);
        }

        variableNumber = variableNumber.replaceAt(i, smallNumbers[0]);
        variableNumber = variableNumber.replaceAt(k, smallNumbers[1]);

        if (
          Number(winningNumber) !== Number(variableNumber) &&
          Number(winningNumber[i]) !== Number(variableNumber[i]) &&
          Number(winningNumber[k]) !== Number(variableNumber[k])
        ) {
          thirdPlace.push(variableNumber);
        }
      }
      variableNumber = winningNumber;
    }
    variableNumber = winningNumber;
  }
  return thirdPlace;
};

const findIntersection = (winningNumberList, selectedNumberList) => {
  return winningNumberList.filter((v) => selectedNumberList.includes(v));
};

module.exports = {
  secondPlaceGenerator,
  thirdPlaceGenerator,
  findIntersection,
};
