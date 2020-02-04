import autobahn from "autobahn";

export default interface IOptions extends autobahn.IConnectionOptions {
  namespace: string,
}
