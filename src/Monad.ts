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
const just = <T extends {}>(value: T) => new Just(value);

const none = nothing<number>();
const twelve = just(12);
const log = <T>(maybe: MayBe<T>) => maybe.tap();
log(none);
log(twelve);
