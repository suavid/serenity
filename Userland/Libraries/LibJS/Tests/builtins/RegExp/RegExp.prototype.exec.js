test("basic functionality", () => {
    let re = /foo/;
    expect(re.exec.length).toBe(1);

    let res = re.exec("foo");
    expect(res.length).toBe(1);
    expect(res[0]).toBe("foo");
    expect(res.groups).toBe(undefined);
    expect(res.index).toBe(0);
});

test("basic unnamed captures", () => {
    let re = /f(o.*)/;
    let res = re.exec("fooooo");

    expect(res.length).toBe(2);
    expect(res[0]).toBe("fooooo");
    expect(res[1]).toBe("ooooo");
    expect(res.groups).toBe(undefined);
    expect(res.index).toBe(0);

    re = /(foo)(bar)?/;
    res = re.exec("foo");

    expect(res.length).toBe(3);
    expect(res[0]).toBe("foo");
    expect(res[1]).toBe("foo");
    expect(res[2]).toBe(undefined);
    expect(res.groups).toBe(undefined);
    expect(res.index).toBe(0);

    re = /(foo)?(bar)/;
    res = re.exec("bar");

    expect(res.length).toBe(3);
    expect(res[0]).toBe("bar");
    expect(res[1]).toBe(undefined);
    expect(res[2]).toBe("bar");
    expect(res.groups).toBe(undefined);
    expect(res.index).toBe(0);
});

test("basic named captures", () => {
    let re = /f(?<os>o.*)/;
    let res = re.exec("fooooo");

    expect(res.length).toBe(2);
    expect(res.index).toBe(0);
    expect(res[0]).toBe("fooooo");
    expect(res[1]).toBe("ooooo");
    expect(res.groups).not.toBe(undefined);
    expect(res.groups.os).toBe("ooooo");
});

test("basic index", () => {
    let re = /foo/;
    let res = re.exec("abcfoo");

    expect(res.length).toBe(1);
    expect(res.index).toBe(3);
    expect(res[0]).toBe("foo");
});

test("basic index with global and initial offset", () => {
    let re = /foo/g;
    re.lastIndex = 2;
    let res = re.exec("abcfoo");

    expect(res.length).toBe(1);
    expect(res.index).toBe(3);
    expect(res[0]).toBe("foo");
});

test("not matching", () => {
    let re = /foo/;
    let res = re.exec("bar");

    expect(res).toBe(null);
});

// Backreference to a group not yet parsed: #6039
test("Future group backreference, #6039", () => {
    let re = /(\3)(\1)(a)/;
    let result = re.exec("cat");
    expect(result.length).toBe(4);
    expect(result[0]).toBe("a");
    expect(result[1]).toBe("");
    expect(result[2]).toBe("");
    expect(result[3]).toBe("a");
    expect(result.index).toBe(1);
});

// #6108
test("optionally seen capture group", () => {
    let rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/;
    let ua = "mozilla/4.0 (serenityos; x86) libweb+libjs (not khtml, nor gecko) libweb";
    let res = rmozilla.exec(ua);

    expect(res.length).toBe(3);
    expect(res[0]).toBe("mozilla");
    expect(res[1]).toBe("mozilla");
    expect(res[2]).toBeUndefined();
});

// #6131
test("capture group with two '?' qualifiers", () => {
    let res = /()??/.exec("");

    expect(res.length).toBe(2);
    expect(res[0]).toBe("");
    expect(res[1]).toBeUndefined();
});

test("named capture group with two '?' qualifiers", () => {
    let res = /(?<foo>)??/.exec("");

    expect(res.length).toBe(2);
    expect(res[0]).toBe("");
    expect(res[1]).toBeUndefined();
    expect(res.groups.foo).toBeUndefined();
});

// #6042
test("non-greedy brace quantifier", () => {
    let res = /a[a-z]{2,4}?/.exec("abcdefghi");

    expect(res.length).toBe(1);
    expect(res[0]).toBe("abc");
});

// #6208
test("brace quantifier with invalid contents", () => {
    let re = /{{lit-746579221856449}}|<!--{{lit-746579221856449}}-->/;
    let res = re.exec("{{lit-746579221856449}}");

    expect(res.length).toBe(1);
    expect(res[0]).toBe("{{lit-746579221856449}}");
});
