const { app } = require('electron')

const path = require("path");
const fs = require("fs");

// utilcode
const utilcode = require("../../modules/utilcodes/main")

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
async function fet(url) {
    try {
        const response = await fetch(url);

        if (response.status !== 200) {
            throw new Error('Error en la solicitud: ' + response.status);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}

// verificar search
async function verySearch(fileruta) {
    const filepath = path.join(fileruta);
    if (!fs.existsSync(filepath)) {
        return false;
    }
    const searchfile = await utilcode.fsRead(filepath);
    return utilcode.jsonParse(searchfile);
}
async function saveCache(fileruta, value) {
    const filepath = path.join(fileruta);
    try {
        await utilcode.fsWrite(filepath, JSON.stringify(value, null, 2));
    } catch (error) {
        return false;
    }
}


async function veryFiles(raiz, ruta) {
    await utilcode.createFolderRecursive(raiz, ruta);

    // verificar si existe el archivo de configuracion
    const fileCog = path.join(raiz, ruta, "cog.json");
    if (!fs.existsSync(fileCog)) {
        await utilcode.fsWrite(fileCog, JSON.stringify({}, null, 2));
    }
}

// package
let pakContainer = require("../../package.json")
let pak = require("./package.json")

// Appdata
const appDataPath = app.getPath('appData')
let fileCog = path.join(path.normalize(appDataPath), pakContainer.name, "apps", pak.name, "json", "cog.json");

veryFiles(path.normalize(appDataPath), `${pakContainer.name}/apps/` + pak.name + "/json");
veryFiles(path.normalize(appDataPath), `${pakContainer.name}/apps/` + pak.name + "/cache");


// Libreria
const lib = require("../../modules/util-libraries")

const routes = [
    {
        method: "get",
        path: "/",
        handler: (req, res) => {
            res.render(path.join(__dirname, "views", "index"), { pak });
        },
    },
    {
        method: "get",
        path: "/cog",
        handler: async (req, res) => {
            const readCog = await utilcode.fsRead(fileCog);
            let parse = utilcode.jsonParse(readCog);
            res.json(parse);
        },
    },
    {
        method: "post",
        path: "/save-cog",
        handler: async (req, res) => {
            let value = req.body;
            try {
                const readCog = await utilcode.fsRead(fileCog);
                let parse = utilcode.jsonParse(readCog);
                parse = {
                    ...parse,
                    ...value
                }

                await utilcode.fsWrite(fileCog, JSON.stringify(parse, null, 2));
                res.send(true);
            } catch (error) {
                res.send(false);
            }
        },
    },
    {
        method: "get",
        path: "/rawg",
        handler: async (req, res) => {
            let qs = req.query;
            let keydf = "f22f8bfa1fc8493dbc156b4683edbf15";
            const folderpath = path.join(path.normalize(appDataPath), pakContainer.name, "apps", pak.name, "cache", `${utilcode.clearSymbols(qs.searchText)}_${qs.page}.json`);
            try {
                const readCog = await utilcode.fsRead(fileCog);
                let { thekey = keydf, cache = "on" } = utilcode.jsonParse(readCog);
                const urlKey = `https://api.rawg.io/api/games?key=${thekey ? thekey : keydf}&search=${qs.searchText}&page=${qs.page}&page_size=${qs.size}`;
                let result;
                if (cache == "on") {
                    let very = await verySearch(folderpath);
                    if (!very) {
                        result = await fet(urlKey);
                        await saveCache(folderpath, result)
                    } else {
                        result = very;
                    }
                } else {
                    result = await fet(urlKey);
                }


                res.json(result)
            } catch (error) {
                res.json(false)
            }
        },
    }
];

module.exports = [...routes, ...lib];