import { Editor } from './src/models/Editor'

async function test() {
   const e = await Editor.factory()
   console.log("Has name:", e.has("name"))
   console.log("Properties:", Object.keys(e.dataObject._properties))
}
test()
