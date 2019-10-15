export default class EditorText {
    constructor() {
        this.inputText = "";
    }

    setText(text) {
        this.inputText = text;
        return this.inputText;
    }

    getText() {
        return this.inputText;
    }

    changeText(type) {
        if (type === 1) {
            this.setText(this.getText().replace(/，/g, ','));
        }
    }

    isFormula() {
        let inputText = this.getText();
        if(inputText.lastIndexOf("=") == 0) {
            return true;
        }
        return false;
    }
}