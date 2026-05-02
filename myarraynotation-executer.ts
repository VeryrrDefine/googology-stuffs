export type MANNumber = MyArrayNotation | number;
class Spliter {
  inner: AdditionalTerm;
  constructor(inner: AdditionalTerm) {
    this.inner = inner;
  }
  toString() {
    return `(${this.inner})`;
  }
}
class AdditionalTerm {
  terms: (MANNumber | Spliter)[] = [];
  constructor(x?: number) {
    if (x !== undefined) {
      this.terms = [x];
    }
  }
  clone() {
    let x = new AdditionalTerm();
    x.terms = Array.from(this.terms);
    return x;
  }
  empty() {
    return (
      this.terms.length == 0 || this.terms.find((x) => x !== 1) === undefined
    );
  }
  toString() {
    return this.terms.join(",");
  }
  execute(x: MANNumber): AdditionalTerm {
    if (this.terms[0] !== 1)
      throw new Error("Cannot execute this additional term");
    let newterm = Array.from(this.terms);
    let last1 = 0;
    for (let i = 0; i < newterm.length; i++) {
      if (newterm[i] == 1) {
        last1 = i;
      } else if (newterm[last1 + 1] instanceof Spliter) {
        i++;
      } else {
        break;
      }
    }
    if (last1 >= newterm.length - 1) throw new Error("Executed Term is all 1");
    // {1,1,1...,1,2}
    // {1,1,1...,10,1}

    newterm[last1] = x;

    if (newterm[last1 + 1] instanceof Spliter) {
      throw new Error("Not Implemented");
    } else {
      newterm[last1 + 1] = substract(newterm[last1 + 1] as MANNumber);
      let n = new AdditionalTerm();
      n.terms = newterm;

      return n;
    }
  }
}
function substract(x: MANNumber) {
  if (typeof x == "number") return x - 1;
  let a = x.clone();
  a.substracted++;
  return a;
}
export class MyArrayNotation {
  base: number = 10;
  exponent: MANNumber = 1;

  additionalTerm: AdditionalTerm = new AdditionalTerm();
  substracted: number = 0;
  clone() {
    let a = new MyArrayNotation();
    a.base = this.base;
    a.exponent = this.exponent;
    a.substracted = this.substracted;
    a.additionalTerm = this.additionalTerm.clone();
    return a;
  }
  calculate(): number {
    if (this.additionalTerm.empty()) {
      let exp = 1;
      try {
        if (typeof this.exponent !== "number") exp = this.exponent.calculate();
        else exp = this.exponent;
      } catch (e) {
        throw new Error("Number to large or infinite-descending");
      }
      let calc = this.base ** exp;
      if (calc === Infinity) throw new Error("Number to large");
      return calc;
    }

    let deduc = this.deduct();
    if (deduc === undefined) throw new Error("Not Implemented");
    else if (typeof deduc == "number") return deduc;
    else return deduc.calculate();
  }
  /**
   * Deduct it what it equals to?
   */
  deduct(): number | MyArrayNotation {
    if (this.exponent == 1) return this.base;
    if (this.additionalTerm.empty()) return this.calculate();
    if (typeof this.exponent == "object") {
      //   console.warn("Consider to trying deduct exponent...?");
      let outside = this.clone();
      outside.exponent = D(outside.exponent);
      return outside;
    }
    if (this.additionalTerm.terms[0] instanceof Spliter)
      throw new Error("Cannot calculate");
    let z = substract(this.additionalTerm.terms[0]);
    if (z == 0) {
      let outside = new MyArrayNotation();
      outside.base = this.base;
      outside.exponent = this.base;
      outside.additionalTerm = this.additionalTerm.execute(this.exponent);
      return outside;
      // throw new Error("Not Implemented");
    }
    let Q = this.additionalTerm.terms.slice(1);
    let outside = new MyArrayNotation();
    outside.base = this.base;
    outside.additionalTerm.terms = [z, ...Q];
    outside.exponent = new MyArrayNotation();
    outside.exponent.base = this.base;
    outside.exponent.exponent = substract(this.exponent);
    outside.exponent.additionalTerm.terms = [
      this.additionalTerm.terms[0],
      ...Q,
    ];
    // console.log(`${this} = ${outside}`);
    return outside;
    // throw new Error("Not Implemented");
  }
  toString() {
    return `{${this.base},${this.exponent}|${this.additionalTerm}}${this.substracted == 1 ? `-${this.substracted}` : ""}`;
  }
}
function D(x: MANNumber) {
  if (typeof x == "number") return x;
  return x.deduct();
}
let man = new MyArrayNotation();
man.base = 2;
man.exponent = 2;
man.additionalTerm = new AdditionalTerm();
man.additionalTerm.terms = [1, new Spliter(new AdditionalTerm(1)), 2];

let man1: MyArrayNotation = man;
let res: any = NaN;
for (let i = 0; true; i++) {
  try {
    let man2 = man1.deduct();
    if (typeof man2 == "number") {
      console.log(`Terminate after ${i} steps.`);
      res = man2;
      break;
    }
    man1 = man2;
  } catch (e) {
    console.log(`Error after ${i} steps.`);
    console.log(e);
    break;
  }
  console.log("a[" + i + "]", man1.toString());
}
if (isNaN(res)) {
  console.log(man.toString(), "way to large");
} else console.log("Res", man.toString(), "=", res.toString());
