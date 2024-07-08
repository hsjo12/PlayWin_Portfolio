String.prototype.replaceAt = function (index, replacement) {
  if (index >= this.length) {
    return this.valueOf();
  }

  return this.substring(0, index) + replacement + this.substring(index + 1);
};
export const secondPlaceGenerator = (winningNumber) => {
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

export const thirdPlaceGenerator = (winningNumber) => {
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

export const matchWinningNumbers = (winningNumberList, selectedNumberList) => {
  if (selectedNumberList.length === 0) return [];
  const onlyArrayOfUserSelectedNumber = selectedNumberList.map((v) => v.number);
  const matchedWinningNumber = winningNumberList.filter((v, i) =>
    onlyArrayOfUserSelectedNumber.includes(v)
  );
  return matchedWinningNumber;
};

export const formattedInfo = async (
  currentRound,
  matchedWinningNumber,
  winningRound,
  winningPlace,
  claimableRound
) => {
  const array = [];

  return matchedWinningNumber.map((v, i) => {
    const deadlineRound = Number(winningRound) + Number(claimableRound);

    return {
      round: winningRound,
      winningNumber: v,
      winningPlace,
      deadlineRound: String(deadlineRound),
      claimPeriod:
        deadlineRound > currentRound ? deadlineRound - Number(currentRound) : 0,
    };
  });
};
