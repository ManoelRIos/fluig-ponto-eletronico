export class Constraint {
  constructor(
      public _field: String = '',
      public _initialValue: String | Number | Boolean | null = '',
      public _finalValue: String | Number | Boolean | null = '',
      public _type: Number = 1,
      public _likeSearch: Boolean = false,
  ) {
      this._finalValue = (this._finalValue || this._finalValue == null) ? this._finalValue : this._initialValue
  }
}
