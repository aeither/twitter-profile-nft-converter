import axios from "axios";

export function getBuffer(url: string) {
  return axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response: any) => Buffer.from(response.data, "binary"));
}
