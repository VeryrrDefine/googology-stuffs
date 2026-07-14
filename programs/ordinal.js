function genOrd(nums) {
    const len = nums.length;
    const last = nums[len - 1];
    let max = last + 1;
    while (max > 1) {
        nums.push(max);
        let r;
        let badRoot = max;
        let checked = false;
        while (badRoot >= 1) {
            for (let x = len; x >= 0; x--) {
                if (nums[x] === badRoot) {
                    r = x; //r = bad root pos
                    break;
                }
            }
            // if (r === 0) {
            //     badRoot--; continue;// badroot2: 1,1,2 => []\[2], check badroot1 needed
            // }
            let r2 = -1;
            let foundBrach = false;
            for (let x = r - 1; x >= 0; x--) {
                if (nums[x] < badRoot) {
                    foundBrach = true;
                    break;
                }
                // if (nums[x] >= badRoot && foundBrach===-1) {
                //     foundBrach = x + 1;
                // }
                if (nums[x] === badRoot) {
                    r2 = x; //r = bad root
                    break;
                }
            }
            if (foundBrach || r2 === -1) {
                badRoot--;
                continue;
            }
            const left = nums.slice(r2, r);
            const right = nums.slice(r);
            if (cmp(left, right) >= 0) {
                badRoot--;
            }
            else {
                max--;
                break;
            }
        }
        nums.pop();
        if (badRoot <= 0 || checked)
            break;
    }
    let res = [1];
    for (let i = 2; i <= max; i++) {
        res.push(i);
    }
    return res;
}
function convert2Ord(a) {
    if (!a.length)
        return "0";
    let out = "";
    a = a.map(e => e - 1);
    a.unshift(-1);
    let i;
    for (i = 1; i < a.length; i++)
        if (a[i] > a[i - 1])
            out += "ω^(";
        else
            out += "0)" + ")".repeat(a[i - 1] - a[i]) + "+ω^(";
    return (out + "0)" + ")".repeat(a[i - 1])).replace(/ω\^\(0\)/g, "1").replace(/\^\(1\)/g, "");
}
function printOrd(a) {
    let str = convert2Ord(a);
    // function printOrd(a) {
    //     let str = (a);
    let cursor = 0;
    const atom = () => {
        return str[cursor++];
    };
    const item1 = () => {
        let it;
        if (str[cursor] === "ω" || str[cursor] === "1" || str[cursor] === "0") {
            it = atom();
        }
        else if (str[cursor] === "(") {
            cursor++;
            it = item();
            cursor++; // for ")"
        }
        while (str[cursor] === "^") {
            it = [str[cursor++], it, item1()];
        }
        return it;
    };
    const item = () => {
        let count = 1;
        let it = item1();
        let arr = [it];
        while (str[cursor] === "+") {
            count++;
            cursor++;
            arr.push(item1());
        }
        if (count > 1) {
            arr.unshift("+");
            return arr;
        }
        return it;
    };
    let ast = item();
    // console.log(JSON.stringify(ast));
    const eq = (a1, a2) => {
        if (a1 === undefined || a2 === undefined)
            return false;
        if (a1 === a2)
            return true;
        if (a1.length === 3 && a2.length === 3) {
            return a1[0] === a2[0] && eq(a1[1], a2[1]) && eq(a1[2], a2[2]);
        }
        return false;
    };
    const calc = (ast) => {
        if (typeof ast === "string")
            return ast;
        if (ast[0] === "+") {
            let item = null;
            let newTerm = [];
            for (let a of ast) {
                if (a === "+")
                    continue;
                a = calc(a);
                if (item && isFinite(item)) {
                    if (isFinite(a)) {
                        item = Number(item) + Number(a);
                    }
                    else {
                        newTerm.push(item);
                        item = null;
                        continue;
                    }
                }
                if (item && a[0] === "*") {
                    // a + a*b
                    if (eq(item[1], a[1])) {
                        item[2] = Number(item[2]) + Number(a[2]);
                    }
                }
                else if (item && eq(item[1], a)) {
                    item[2]++;
                }
                else if (item && !isFinite(item)) {
                    // if cant merge, push it onto new term, and remove *1 if it have
                    newTerm.push(item[2] === 1 ? item[1] : item);
                    item = a[0] === "*" ? a : ["*", a, 1];
                }
                item ??= isFinite(a) ? a : a[0] === "*" ? a : ["*", a, 1];
            }
            if (item)
                newTerm.push(item[2] === 1 ? item[1] : item);
            if (newTerm.length === 1) {
                return newTerm[0];
            }
            else {
                newTerm.unshift("+");
                return newTerm;
            }
        }
        if (ast[0] === "^") {
            ast[1] = calc(ast[1]);
            ast[2] = calc(ast[2]);
            return ast;
        }
    };
    ast = calc(ast);
    const stringify = (ast) => {
        if (typeof ast !== "object") {
            return ast.toString();
        }
        if (ast[0] === "+") {
            return stringify(ast.slice(1).map(e => stringify(e)).join("+"));
        }
        if (ast[0] === "*") {
            return stringify(ast.slice(1).map(e => stringify(e)).join("*"));
        }
        if (ast[0] === "^") {
            const pow = stringify(ast[2]);
            return stringify(ast[1]) + "^" + (pow.length === 1 || isFinite(pow) ? pow : `(${pow})`);
        }
    };
    return stringify(ast).replaceAll(/\+1\*/g, "+").replaceAll(/^1\*/g, "");
}
function cmp(o1, o2) {
    const len = Math.max(o1.length, o2.length);
    let res = 0; //for 0 == 0
    for (let i = 0; i < len; i++) {
        res = (o1[i] ?? 0) - (o2[i] ?? 0);
        if (res !== 0)
            return res;
    }
    return res;
}
function expandOrd(s, base) {
    let len = s.length;
    let c = s[len - 1];
    let e = s.slice(0, len - 1);
    if (c !== 1) {
        let r;
        for (let x = len - 2; x >= 0; x--) {
            if (s[x] < c) {
                r = x; //r = bad root
                break;
            }
        }
        //bad part r～len-1
        for (let i = 0; i < base; i++)
            for (let x = r; x < len - 1; x++) {
                e.push(s[x]);
            }
    }
    return e;
};

module.exports = {
    genOrd, convert2Ord, printOrd, cmp, expandOrd
}