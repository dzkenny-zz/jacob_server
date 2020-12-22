import * as _ from 'lodash';

export class Setting {
    blank: number = 1;
    spy: number = 1;
    isRandom: boolean = true;
    correct: string = '';
    wrong: string = '';

    constructor(data: Partial<Setting>) {
        this.parse(data);
    }

    parse = (data: Partial<Setting>) => {
        this.blank = _.get(data, 'blank', 1);
        this.spy = _.get(data, 'spy', 1);
        this.isRandom = _.get(data, 'isRandom', false);
        this.correct = _.get(data, 'correct', '');
        this.wrong = _.get(data, 'wrong', '');
    }

    toJson = () => {
        return {
            blank: this.blank,
            spy: this.spy,
            isRandom: this.isRandom,
            correct: this.correct,
            wrong: this.wrong
        }
    }
}