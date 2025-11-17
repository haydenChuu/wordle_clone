
def evaluate_guess(guess, target):
    guess = guess.upper()
    target = target.upper()

    result = []
    target_letters = list(target)
    guess_letters = list(guess)

    # First pass: check for correct letters in correct spots
    for i, letter in enumerate(guess_letters):
        if letter == target_letters[i]: # if correct letter and position, mark as correct
            result.append({"letter": letter, "status": "correct"})
            target_letters[i] = None  # remove matched letter from target
        else: # mark letter as pending for now
            result.append({"letter": letter, "status": "pending"})

    # Second pass: check for present letters and absent letters
    for i, item in enumerate(result):
        if item["status"] == "pending": # check only pending letters
            letter = item["letter"] 
            if letter in target_letters: # check if letter is present elsewhere
                item["status"] = "present"
                target_letters[target_letters.index(letter)] = None  # remove matched letter from target
            else:
                item["status"] = "absent"
    return result