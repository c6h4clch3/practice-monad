export type Converter<T, U> = (v: T) => U;
export interface Functor<T> {
  map<U>(f: Converter<T, U>): Functor<U>;
}

export interface Applicative<T> extends Functor<T> {
  matrix<U extends Converter<T, any>>(
    f: Applicative<U>
  ): Applicative<ReturnType<U>>;
  map<U>(f: Converter<T, U>): Applicative<U>;
}

export interface Monad<T> {
  flatMap<U>(f: Converter<T, Monad<U>>): Monad<U>;
}

export class List<T> implements Functor<T>, Applicative<T>, Monad<T> {
  private values: T[] = [];
  constructor(...args: (T[] | List<T>)[]) {
    this.values = args.reduce<T[]>((memo, v) => [...memo, ...v], []);
  }

  map<U>(func: (v: T) => U) {
    return new List(this.values.map(func));
  }

  matrix<U extends Converter<T, any>>(func: List<U>): List<ReturnType<U>> {
    return this.values.reduce(
      (memo, v) => new List(memo, func.map(f => f(v))),
      new List([] as ReturnType<U>[])
    );
  }

  flatMap<U>(f: Converter<T, List<U>>): List<U> {
    return this.values.reduce(
      (memo, v) => new List(memo, f(v)),
      new List([] as U[])
    );
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator]();
  }
}

type MayBe<T> = Nothing<T> | Just<T>;
class Nothing<T extends {}> implements Applicative<T>, Monad<T> {
  map<U>(func: Converter<T, U>): MayBe<U> {
    return new Nothing();
  }
  matrix<U extends Converter<T, any>>(func: MayBe<U>): MayBe<ReturnType<U>> {
    return new Nothing();
  }
  flatMap<U>(func: Converter<T, MayBe<U>>): MayBe<U> {
    return new Nothing();
  }
  tap(func?: (v?: T) => void) {
    if (func) {
      func(undefined);
      return this;
    }
    console.log("Nothing: " + null);
    return this;
  }
}
const nothing = <T>() => new Nothing<T>();
class Just<T extends {}> implements Applicative<T>, Monad<T> {
  private value: T;
  constructor(value: T) {
    if (value == undefined) {
      throw TypeError("");
    }
    this.value = value;
  }

  map<U>(func: Converter<T, U>): MayBe<U> {
    const result = func(this.value);
    if (result == undefined) {
      return new Nothing();
    }
    return new Just(result);
  }

  matrix<U extends Converter<T, any>>(func: MayBe<U>): MayBe<ReturnType<U>> {
    if (func instanceof Nothing) {
      return new Nothing();
    }

    return func.map(f => f(this.value));
  }

  flatMap<U>(func: Converter<T, MayBe<U>>): MayBe<U> {
    return func(this.value);
  }

  tap(func?: (v?: T) => void) {
    if (func) {
      func(this.value);
      return this;
    }
    console.log("Just: " + this.value);
    return this;
  }
}
const just = <T>(value?: T): MayBe<T> =>
  value != undefined ? new Just(value) : new Nothing();

const none = just<number>();
const twelve = just(12);
const numToStr = (val: number) => just(val.toString());
const add3 = (val: number) => just(val + 3);
const log = <T>(maybe: MayBe<T>) => maybe.tap();
log(none);
log(twelve);

console.log("モナド則の検証");
const ret = <T>(x: T) => just(x);

// return x >>= f ≡ f x
ret(12)
  .flatMap(numToStr)
  .tap(() => console.log("return x >>= f: "))
  .tap();
numToStr(12)
  .tap(() => console.log("f x: "))
  .tap();

// m >>= return ≡ m
just(12)
  .flatMap(ret)
  .tap(() => console.log("m >>= return: "))
  .tap();
just(12)
  .tap(() => console.log("m: "))
  .tap();

// (m >>= f) >>= g ≡ m >>= (\x -> (f x >>= g))
twelve
  .flatMap(add3)
  .flatMap(numToStr)
  .tap(() => console.log("(m >>= f) >>= g: "))
  .tap();
twelve
  .flatMap(x => add3(x).flatMap(numToStr))
  .tap(() => console.log("m >>= (\\x -> (f x >>= g))"))
  .tap();
