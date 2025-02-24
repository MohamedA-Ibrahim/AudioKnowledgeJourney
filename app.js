class AudioGame {
    constructor() {
        this.currentLevel = 1;
        this.questions = [];  // Questions stored in memory
        this.currentQuestion = 0;
        this.speech = new SpeechSynthesisUtterance();
        this.speech.rate = 0.9; // Slightly slower speech rate for clarity
        this.speech.pitch = 1;
        this.speech.volume = 1;
        this.isPlaying = false;
        
        // Set up voice when voices are loaded
        speechSynthesis.addEventListener('voiceschanged', () => {
            this.setupVoice();
        });
        
        // Try to set up voice immediately in case voices are already loaded
        this.setupVoice();
        
        this.recognition = null;
        this.isListening = false;
        this.voiceButtonAdded = false;  // Add this flag
        
        // Start with instructions if we have questions, otherwise show PIN screen
        if (AudioGame.allQuestions.length > 0) {
            this.questions = AudioGame.allQuestions;
            this.initializeEventListeners();
            this.setupTutorial();
        } else {
            this.showPinScreen();
        }
    }

    // Static property to store all questions across instances
    static allQuestions = [];

    initializeEventListeners() {
        // Button click listeners
        document.getElementById('start-tutorial').addEventListener('click', () => this.startTutorial());
        document.getElementById('play-question').addEventListener('click', () => this.playQuestion());
        document.getElementById('play-options').addEventListener('click', () => this.playOptions());
        document.getElementById('repeat-instructions').addEventListener('click', () => this.playInstructions());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying) return; // Don't handle keypresses while speaking

            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    if (document.getElementById('instructions').style.display !== 'none') {
                        this.startTutorial();
                    }
                    break;
                case 'q':
                    this.playQuestion();
                    break;
                case 'o':
                    this.playOptions();
                    break;
                case 'h':
                    this.playInstructions();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    this.checkAnswer(parseInt(e.key) - 1);
                    break;
            }
        });
    }

    setupTutorial() {
        const tutorialText = `
            Welcome to Audio Knowledge Journey! 
            This is an audio-based quiz game. 
            Press Space to start the tutorial.
            You can use keyboard shortcuts to control the game:
            Press Q to hear the question,
            Press O to hear the options,
            Press H for help,
            And use number keys 1 to 4 to select your answer.
        `;
        this.speak(tutorialText);
    }

    startTutorial() {
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        this.setupQuestion();
        this.playInstructions();
    }

    playInstructions() {
        const instructions = `
            You're on level ${this.currentLevel}.
            Press Q to hear the current question.
            Press O to hear the answer options.
            Use number keys 1 through 4 to select your answer.
            Press H anytime to hear these instructions again.
        `;
        this.speak(instructions);
    }

    setupQuestion() {
        const question = this.questions[this.currentQuestion];
        document.getElementById('level-info').textContent = `Level ${this.currentLevel}`;
        
        // Display question text
        const questionContainer = document.getElementById('question-container');
        questionContainer.textContent = question.question;
        
        // Display options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = `${index + 1}. ${option}`;
            button.addEventListener('click', () => this.checkAnswer(index));
            optionsContainer.appendChild(button);
        });

        // Setup voice control if not already set up
        if (!this.voiceButtonAdded) {
            this.setupVoiceRecognition();
            this.addVoiceControlButton();
            this.voiceButtonAdded = true;
        }

        this.playQuestion();
    }

    playQuestion() {
        const question = this.questions[this.currentQuestion];
        this.speak(`Question: ${question.question}`);
    }

    playOptions() {
        const question = this.questions[this.currentQuestion];
        const optionsText = question.options.map((option, index) => {
            return `Option ${index + 1}: ${option}`;
        }).join('. ');
        this.speak(optionsText);
    }

    speak(text) {
        window.speechSynthesis.cancel();
        
        this.isPlaying = true;
        this.speech.text = text;
        
        // Ensure voice is set (in case voices weren't loaded in constructor)
        if (!this.speech.voice) {
            this.setupVoice();
        }
        
        this.speech.onend = () => {
            this.isPlaying = false;
        };
        
        window.speechSynthesis.speak(this.speech);
    }

    checkAnswer(selectedIndex) {
        if (this.isPlaying) return; // Don't accept answers while speaking

        const question = this.questions[this.currentQuestion];
        const isCorrect = selectedIndex === question.correct;

        // Visual feedback
        const buttons = document.querySelectorAll('.option-btn');
        buttons[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
        
        if (isCorrect) {
            buttons[selectedIndex].classList.add('correct');
        } else {
            buttons[selectedIndex].classList.add('incorrect');
        }

        const feedback = isCorrect 
            ? "Correct! Well done!" 
            : "Incorrect. Try again!";

        this.speak(feedback);

        if (isCorrect) {
            setTimeout(() => {
                this.currentQuestion++;
                if (this.currentQuestion >= this.questions.length) {
                    this.showSuccessScreen();
                } else {
                    this.setupQuestion();
                }
            }, 2000);
        }
    }

    // Add new method to show PIN entry screen
    showPinScreen() {
        document.getElementById('pin-screen').style.display = 'block';
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('game-container').style.display = 'none';
        
        document.getElementById('submit-pin').addEventListener('click', () => this.validatePin());
        
        document.getElementById('pin-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validatePin();
            }
        });

        this.speak("Welcome! Please enter PIN 0000 to add questions.");
    }

    // Modified method to handle question addition
    validatePin() {
        const pin = document.getElementById('pin-input').value;
        if (pin === '0000') {
            this.showQuestionForm();
        } else {
            this.speak("Invalid PIN. The PIN is 0000.");
            document.getElementById('pin-input').value = '';
        }
    }

    // New method to show question form
    showQuestionForm() {
        document.getElementById('pin-screen').style.display = 'none';
        document.getElementById('question-form').style.display = 'block';
        
        document.getElementById('add-question-btn').addEventListener('click', () => this.addNewQuestion());
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
    }

    // New method to add a question
    addNewQuestion() {
        const questionText = document.getElementById('question-text').value;
        const option1 = document.getElementById('option1').value;
        const option2 = document.getElementById('option2').value;
        const option3 = document.getElementById('option3').value;
        const option4 = document.getElementById('option4').value;
        const correctAnswer = parseInt(document.getElementById('correct-answer').value) - 1;

        if (!questionText || !option1 || !option2 || !option3 || !option4 || isNaN(correctAnswer)) {
            this.speak("Please fill in all fields");
            return;
        }

        const newQuestion = {
            question: questionText,
            options: [option1, option2, option3, option4],
            correct: correctAnswer
        };

        AudioGame.allQuestions.push(newQuestion);
        this.speak("Question added successfully");

        // Clear the form
        document.getElementById('question-text').value = '';
        document.getElementById('option1').value = '';
        document.getElementById('option2').value = '';
        document.getElementById('option3').value = '';
        document.getElementById('option4').value = '';
        document.getElementById('correct-answer').value = '';
    }

    // New method to start the game
    startGame() {
        if (AudioGame.allQuestions.length === 0) {
            this.speak("Please add at least one question before starting the game");
            return;
        }

        // Remove existing voice control if present
        const voiceButton = document.getElementById('voice-control');
        if (voiceButton) {
            voiceButton.remove();
            this.voiceButtonAdded = false;
        }

        this.questions = AudioGame.allQuestions;
        document.getElementById('question-form').style.display = 'none';
        document.getElementById('instructions').style.display = 'block';
        
        this.initializeEventListeners();
        this.setupTutorial();
    }

    showSuccessScreen() {
        // Remove voice control button if it exists
        const voiceButton = document.getElementById('voice-control');
        if (voiceButton) {
            voiceButton.remove();
            this.voiceButtonAdded = false;
        }
        
        // Stop voice recognition if it's running
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }

        document.getElementById('game-container').style.display = 'none';
        document.getElementById('success-screen').style.display = 'block';
        
        const successMessage = `
            Congratulations! You've completed all questions in level ${this.currentLevel}!
            Your final score: ${this.currentQuestion} questions completed.
            Press Space to play again, or press P to add more questions.
        `;
        
        this.speak(successMessage);
        
        // Add success screen keyboard controls
        const successHandler = (e) => {
            if (this.isPlaying) return;
            
            switch(e.key.toLowerCase()) {
                case ' ':
                    // Reset and restart game
                    this.currentQuestion = 0;
                    this.currentLevel = 1;
                    document.getElementById('success-screen').style.display = 'none';
                    document.getElementById('game-container').style.display = 'block';
                    this.setupQuestion();
                    document.removeEventListener('keydown', successHandler);
                    break;
                case 'p':
                    // Go to PIN screen to add more questions
                    document.getElementById('success-screen').style.display = 'none';
                    this.showPinScreen();
                    document.removeEventListener('keydown', successHandler);
                    break;
            }
        };
        
        document.addEventListener('keydown', successHandler);
        
        // Add click handlers for buttons
        document.getElementById('play-again-btn').addEventListener('click', () => {
            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
            successHandler(spaceEvent);
        });
        
        document.getElementById('add-more-btn').addEventListener('click', () => {
            const pEvent = new KeyboardEvent('keydown', { key: 'p' });
            successHandler(pEvent);
        });
    }

    // Add new method to set up voice
    setupVoice() {
        const voices = speechSynthesis.getVoices();
        
        // Try to find a good English voice in this order:
        // 1. Microsoft Zira (clear female voice)
        // 2. Google UK English Female
        // 3. Any English voice
        // 4. Default system voice
        
        let selectedVoice = voices.find(voice => voice.name === 'Microsoft Zira Desktop') ||
                           voices.find(voice => voice.name === 'Google UK English Female') ||
                           voices.find(voice => voice.lang.startsWith('en')) ||
                           voices[0];
        
        if (selectedVoice) {
            this.speech.voice = selectedVoice;
            console.log('Selected voice:', selectedVoice.name);
        }
    }

    // Add this method to the AudioGame class to help with testing available voices
    listAvailableVoices() {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:');
        voices.forEach(voice => {
            console.log(`- ${voice.name} (${voice.lang})`);
        });
    }

    // Add new method to set up voice recognition
    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase().trim();
                console.log('Voice command:', command);
                this.handleVoiceCommand(command);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                document.getElementById('voice-control').classList.remove('listening');
                if (this.continuousListening) {
                    this.startListening();
                }
            };
        } else {
            console.log('Speech Recognition not supported');
        }
    }

    // Add new method to handle voice commands
    handleVoiceCommand(command) {
        if (this.isPlaying) return;
        
        // Only handle commands if game container is visible
        if (document.getElementById('game-container').style.display === 'none') {
            return;
        }

        switch(command) {
            case 'question':
            case 'q':
                this.playQuestion();
                break;
            case 'options':
            case 'o':
                this.playOptions();
                break;
            case 'help':
            case 'h':
                this.playInstructions();
                break;
            case 'one':
            case '1':
                this.checkAnswer(0);
                break;
            case 'two':
            case '2':
                this.checkAnswer(1);
                break;
            case 'three':
            case '3':
                this.checkAnswer(2);
                break;
            case 'four':
            case '4':
                this.checkAnswer(3);
                break;
        }
    }

    // Add new method to start voice recognition
    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
                document.getElementById('voice-control').classList.add('listening');
            } catch (error) {
                console.log('Recognition error:', error);
            }
        }
    }

    // Add new method to add voice control button
    addVoiceControlButton() {
        const button = document.createElement('button');
        button.id = 'voice-control';
        button.className = 'voice-control-btn';
        button.innerHTML = '🎤';
        button.setAttribute('aria-label', 'Toggle Voice Control');
        
        button.addEventListener('click', () => {
            if (this.isListening) {
                this.recognition.stop();
                this.continuousListening = false;
            } else {
                this.continuousListening = true;
                this.startListening();
            }
        });
        
        document.body.appendChild(button);
    }
}

// Initialize the game
const game = new AudioGame(); 