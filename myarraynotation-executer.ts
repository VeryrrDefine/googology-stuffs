export type MANNumber = MyArrayNotation | number;
class AdditionalTerm {
  terms: number[] = [];
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
        throw new Error("Number to large");
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
    let z = this.additionalTerm.terms[0] - 1;
    if (z == 0) throw new Error("Not Implemented");
    let Q = this.additionalTerm.terms.slice(1);
    let outside = new MyArrayNotation();
    outside.base = this.base;
    outside.additionalTerm.terms = [z, ...Q];
    outside.exponent = new MyArrayNotation();
    outside.exponent.base = this.base;
    outside.exponent.exponent = substract(this.exponent);
    outside.exponent.additionalTerm.terms = [z + 1, ...Q];
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
man.additionalTerm.terms = [1, 2];

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
