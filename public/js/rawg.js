async function fet(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return false;
        }
        return await response.json();
    } catch (error) {
        return false;
    }
}
function _ajax(url, method, data) {
    return new Promise((resolve, reject) => {
        kit.send({
            url: url,
            method: method,
            data,
            success: (respuesta) => {
                resolve(respuesta);
            },
            error: (codigo, respuesta) => {
                reject({ codigo, respuesta });
            }
        });
    });
}

function posSearch(type) {
    if (type == false) {
        $(".pos-center-page").css("margin-top", 100 + "px");
        return
    }
    if (saved.hasKey("isArt")) {
        if (!saved.getSaved("isArt")) {
            const hBody = $("body").height();
            const hDiv = $(".pos-center-page").height();
            const resultPos = (hBody / 2 - (hDiv / 2));
            $(".pos-center-page").css("margin-top", resultPos + "px");
        }
    }

}

function handleScroll() {
    const umbral = 300;
    if (this.scrollTop >= umbral) {
        $(".pos-pe").addClass("active");
    } else if (this.scrollTop < umbral) {
        $(".pos-pe").removeClass("active");
    }
}

async function searchCommand(command) {
    if (command.startsWith("/")) {
        const parts = command.slice(1).split(":");
        const comando = parts[0];
        const valor = parts[1];


        const comandoEncontrado = saved.getSaved("command").find((comandoObj) => {
            return comandoObj.comando === comando && comandoObj.valor === valor;
        });

        if (!comandoEncontrado) {
            const comanaddtext = saved.getSaved("command").find((comandoObj) => {
                return comandoObj.comando === comando;
            });

            if (comanaddtext) {
                await _ajax("/save-cog", "POST", { [comanaddtext.comando]: valor === "false" ? false : valor });
            }
            return true;
        }

        if (comandoEncontrado) {
            if (comandoEncontrado.comando == "close") {
                window.location.href = "#atj=close"
            } else {
                if (comandoEncontrado.comando == comando) {
                    await _ajax("/save-cog", "POST", { [comandoEncontrado.comando]: comandoEncontrado.valor });
                }
            }

            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}


async function renderItems(items) {
    const $artAll = $("#art-all");

    // Verificar si existen elementos
    const $existingItems = $artAll.children();
    if ($existingItems.length > 0) {
        let animationDelay = 0;

        // Animación para reducir el ancho, alto, padding y margin de los elementos existentes
        $existingItems.each(function (index) {
            const $item = $(this);
            $item.animate({
                opacity: 0,
                marginLeft: '-20px'
            }, 500, function () {
                $item.remove();
                if (index === $existingItems.length - 1) {
                    // Esperar un breve período de tiempo después de eliminar los elementos antiguos
                    setTimeout(() => {
                        addNewItems(items);
                    }, 500);
                }
            });
            animationDelay += 100;
        });
    } else {
        // Si no hay elementos existentes, simplemente agrega los nuevos elementos
        addNewItems(items);
    }
}

function addNewItems(items) {
    // show
    kit.show(".page-art-show", 200);
    // add
    const $artAll = $("#art-all");
    let animationDelay = 0;

    for (const item of items) {
        const newItem = saved.getSaved("template")(item);
        const $newItem = $(newItem)
            .css({ opacity: 0, marginLeft: '-20px' })
            .animate({ opacity: 1, marginLeft: '0' }, 500);

        $artAll.append($newItem);
        animationDelay += 100;
    }
    M.AutoInit();
}

function percentUp(arr) {
    if (arr.length === 0) {
        return {}; // Retorna null si el array está vacío
    }

    let maxPercentObject = arr[0];

    arr.forEach(item => {
        if (item.percent > maxPercentObject.percent) {
            maxPercentObject = item;
        }
    });

    return maxPercentObject;
}

function remText(text) {
    let textall = {
        "recommended": "Recomendado",
        "exceptional": "Extraordinario",
        "meh": "Ni bueno ni malo",
        "skip": "No es relevante",
        "na": "Sin valoraciones",
    }

    return textall[text] || "na";
}

function exPlatforms(arr) {
    if (arr) {
        let iconos = saved.getSaved("iconos");
        let html = "";
        arr.forEach(item => {
            html += `<img src="${iconos[item.platform.slug] || iconos["default"]}" class="tooltipped" data-position="bottom" data-tooltip="${item.platform.name}">`;
        });

        return html;
    } else {
        return "N/A";
    }

}

function paginationRawg(totalhits) {
    const pagesAll = Math.ceil(totalhits / 12);
    const pageactive = saved.getSaved("rawgnext");
    $(".page-active").text(pageactive.page);
    $(".page-total").text(pagesAll);
}

$(".page-click").on("click", async (event) => {
    if (saved.hasKey("rawgnext")) {
        // show loading
        $(".btn-search").find(".icono-search").addClass("hide");
        $(".btn-search").find(".preloader-search").removeClass("hide");

        // set pagination
        const pageactive = saved.getSaved("rawgnext");
        const typedata = $(event.currentTarget).attr("data-type");
        if (typedata == "next") {
            if (pageactive.next) {
                let geturl = kit.newQuery(pageactive.next);
                $(".btn-search").addClass("disabled");
                await fetchRawgResults({ searchText: geturl.search, page: geturl.page, size: geturl.page_size });
                $(".btn-search").removeClass("disabled");
            }
        } else if (typedata == "back") {
            if (pageactive.previous) {
                let geturl = kit.newQuery(pageactive.previous);
                $(".btn-search").addClass("disabled");
                await fetchRawgResults({ searchText: geturl.search, page: geturl.page || 1, size: geturl.page_size });
                $(".btn-search").removeClass("disabled");
            }
        }

        // mostrar y ocultar previous
        if (saved.getSaved("rawgnext").page > 1) {
            if ($(".left-page").css("display") == "none") {
                $(".left-page").fadeIn("fast");
            }
        } else {
            if ($(".left-page").css("display") == "block") {
                $(".left-page").fadeOut("fast");
            }
        }

        // mostrar y ocultar next
        const count = Math.ceil(pageactive.count / 12);
        if (saved.getSaved("rawgnext").page == count) {
            if ($(".right-page").css("display") == "block") {
                $(".right-page").fadeOut("fast");
            }
        } else {
            if ($(".right-page").css("display") == "none") {
                $(".right-page").fadeIn("fast");
            }
        }
    }
});

async function fetchRawgResults({ searchText, page = 1, size = 12 }) {
    // obtener datos
    const apiUrl = `/rawg?searchText=${searchText}&page=${page}&size=${size}`;
    let data = await fet(apiUrl);
    await renderItems(data.results);

    // Pagination
    if (data.next) {
        if (!saved.hasKey("rawgnext")) {
            saved.addSaved("rawgnext", {
                value: searchText,
                count: data.count,
                page,
                size,
                next: data.next,
                previous: data.previous
            });
        } else {
            saved.updateValue("rawgnext", {
                count: data.count,
                page,
                next: data.next,
                previous: data.previous
            })

        }
        paginationRawg(data.count);
    } else {
        saved.updateValue("rawgnext", {
            next: null,
            page,
            previous: data.previous
        })
        paginationRawg(data.count);

    }
    //loading
    $(".btn-search").find(".icono-search").removeClass("hide");
    $(".btn-search").find(".preloader-search").addClass("hide");
}

async function setSearch(event) {
    if (event.key) {
        event.preventDefault();
        if (event.key !== "Enter") {
            return
        }
    }

    // verificar si hay texto en el campo
    let searchText = $("#text-search").val();
    searchText = searchText.trim();
    if (searchText.length < 1 && !/\S/.test(searchText)) {
        return;
    }

    // Verificar Comando
    const comm = await searchCommand(searchText);
    if (comm) {
        $("#text-search").val("");
        return
    }

    saved.addSaved("isArt", true);

    // show loading
    $(".btn-search").find(".icono-search").addClass("hide");
    $(".btn-search").find(".preloader-search").removeClass("hide");

    // remove key
    if (saved.hasKey("rawgnext")) {
        saved.removeSaved("rawgnext");
    }

    // get results
    posSearch(false);
    $(".btn-search").addClass("disabled");
    await fetchRawgResults({ searchText });
    $(".btn-search").removeClass("disabled");

}

saved.addSaved("isArt", false);
kit.onDOMReady(async () => {
    // cog
    let { thekey, modalkey = "on" } = await fet("/cog");
    if (!thekey) {
        if (modalkey == "on") {
            kit.modal("materialize", "#thekey");
        }
    }

    // save in cog
    $(".no-show-api").on("click", async () => {
        await _ajax("/save-cog", "POST", { modalkey: "off" });
    })

    // pos center
    posSearch()
})

$(window).on('resize', function () {
    posSearch()
});

$(".wikiapi-container").on("scroll", handleScroll);

// Template
saved.addSaved("template", (item) => {
    return `<div class="elm-col">
    <div class="art-result">
        <div class="banner-art" style="background-image: url(${item.background_image ? item.background_image : "https://devlwte.github.io/appshubster/svg/rawgapi.svg"})">
            <div class="icono-rating tooltipped" data-position="bottom" data-tooltip="${remText(percentUp(item.ratings).title || "na")}">
                <img src="/imagen/emojis/${percentUp(item.ratings).title || "na"}.png" alt="">
            </div>
        </div>
        <div class="info-art">
            <div class="date-name">
                <div class="title-page">
                    ${item.name}
                </div>
                <div class="date-art">
                    ${item.released || "No Date"}
                </div>
            </div>
            <div class="sprt-art">
                <div class="title-elm">Plataformas:</div>
                <div class="platforms">
                    ${exPlatforms(item.parent_platforms)}
                </div>
            </div>
        </div>
    </div>
</div>`
});

// agregar comandos
saved.addSaved("command", [
    { comando: "modalkey", valor: "off" },
    { comando: "modalkey", valor: "on" },
    { comando: "thekey" },
    { comando: "cache", valor: "on" },
    { comando: "cache", valor: "off" },
    { comando: "close", valor: "on" },
]);

// iconos
saved.addSaved("iconos", {
    pc: "/imagen/platforms/pc.svg",
    playstation: "/imagen/platforms/playstation.svg",
    xbox: "/imagen/platforms/xbox.svg",
    android: "/imagen/platforms/android.svg",
    ios: "/imagen/platforms/ios.svg",
    mac: "/imagen/platforms/mac.svg",
    linux: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB8ElEQVR4nGNgGPLA3t6eRdXAIk7N2LxWzdhSg2ID1YzMJ6sZWfyHYPMfyoZWlhQZaOrgdsfY3uV/UHTifxt3H5DBMykysLy6/kNtTcH/uoba/zVNbf/VDC22UGTg1DqDl7/3cfx/so7nb3eF0Xc1Q/M7DAwMjOSaxzixPebW401q/98e9fl/9vh6SFgaWjqTZZq5i0fF1Dnzv715//E/DDv4BH5UNTS/LG9vz0GSYcomJrJmjm7vHjx5BjcMhGctXPJfy8zml6qheQ1JBhrbOXfPXbLiO7JhIPzk+cv/AZHx/3Us7N7r6toIEmWYjIUFp4NXwFl018FwQmb+f2ffoN8axpaRRBm4pFXaMTvV4dGrt+8xDXz35v/aLTv+a5ja/FUzNI/Ba9D//wxM//ezu/w/wPbwxx6uX9XV6f+fvnyFYuCPy0n/21ui/i/os3n8cTt3EX4DD7Ir/j/I/h+Gzy5W+JeUXYBi4M/zfnD5/wfYb/7fz66A28C9HPLIBoLwpGbH77v2H/q//8jx/zUtHb8+7pF4imTgz/8H2VNwG7iHU/r/QfZN/w+yf4BpurVK4Iyupf1aPUv7BZom1kt+72OHGHiA/cz//WzElT7/9zOw/D/I7vb/IHvv/0Oc5qjBwub9/yB7+v9tDOxEGTboAADo+1XLslTjRQAAAABJRU5ErkJggg==",
    nintendo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAACdElEQVR4nO3TyU8TURwHcA7+HV2VtBAxyiLWwSktbYdZWllGDz334kmjifFIIgalRGNIQBMDagylLqEtAlapLEFKWSyy1FpAKcZqahxF0ePXzBRKixG46y/5nt57n/zeb+bl5PybRZLkHpZlz/A832G3290Oh0O30xlxj7iX5/kOjuNOi0Z60cLbnWxzNzj3rBTqbH3SaDRObJeLFJecZnmEWR4jTC3Om+mWNMhc9323Df/CRqgLV5FbNwTZ7QRk7veQd8Uh9y5D7olD/mAFGmcATWYGq/QJLNO1ECprMWw5/jUNsq7pVevTz6hyTcE68EMCNU0ByL1xKPzvoHi+BOXgIhSDS1D0v4Xmhh9OE405ugZtJhZBqhqTJquwCXbOCFXNHlTX1IDrjqfAVj8UgSUoRxegGn8D1WQqylAMefd64TRSGDAw6KKr8EhPYdzAZIOcPwnmTjDdobbtCZTBGFQvo1DPRqCeW89MBPn3H6PRYIFAsgjpaSRJBhN6Ohu0Df0EF/iWnqHYhYSJSGQe6uh6IvPI9/jQqDfjC1GJhM6M5FELxglLBuh6JXCeGNj6W7D2JVJgZ4/Ujfp1Brae/G4vrhyrwEKpCaf4k+jVUwiVVmyCTEdYoC+1w3bzGdiWPgkUryV1F/0LSBiwcpCEkzAgVKzHWHH5lhn2C6Bb/RCvvhvwsq4cnwqIVPYTCB4q2zLDLf9hnqtnW7DhCImP2tJ0Rgt0GWD7SPgP8G4vVOFo9gfZAH1eNBwuQ2JfET6I2VuEEW1JbBO85pYx7S8i3MPomhjLuYbFnZ5eXQmxOJZbuCZmNLdwZVB5oGSn9/+/cnZVvwGKbSQGfDKbYwAAAABJRU5ErkJggg==",
    web: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAACNUlEQVR4nK1US2tTURDORkEFF9qI+gssaMXfoP4IHxTpItJHZtJUd2pa24UgXTQztxAoCq0r/4AP1JUb24KCVXeiuTM3COLShW7kO3nd3DY2VA8MOXNnzpd5fDO53C6nuJTkp6V+BoJ7bi9nUuwoqS+Q2EcW/4XfIGq/We0Dic/DZyAwVrvGYuusfonFX5DaeZKkAClV7QKpvyTxy8Enikf/Ckbqcyy2Or1YP8AaX2e1W+F7C7DpY7dhCz5iqyw+2zcyUv/JajdLtS8nWGyzuPT9cBYQ32Cb0G/H4Ut4k40U9YDTzHLjGKuNkdoGi/8gsUekdo/VH0Oad1tr2vwti5Un5etJvJ1erB9Jp7qAmnV0cWa18amqn0LdWG0FEu5RMkyRTcCn419NrrL43W66YuuF2ua+FODDqWp8tqt3U26mbedY/UFbr1S29gOjZUzyLPaktzn2tFzzof6ASR4+mR48D1SiKB4htdftRxBW+4yUU/oaJKWPwyf9hoARxSP/H7Bc86Fs+HtKWexZZ3pQUBT2X5pC6m+6EYnPl9SvdP/NSyGtKBnO0gZU2ok2pD63jdggaVHsBqu/A3lD3TLEBtkDsUF+tTEMA+49xA5RRfFoe/TCWO0yemE8W6OHCHvAUqnOIqpCzQ9iAWARZAFZ7A5sM/cbh1qjWdkRLB0pmoSaYlWFldWhh19k8VfNmtlG38iyB/XAbJLYFpZqWLRqn8KCFXuPBmyr2aAHfMT6p+XG6UG29B8eZ0kkgLI97QAAAABJRU5ErkJggg==",
    default: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAABLklEQVR4nNXTsSuFYRgF8N9AoiSDxWhQLDLIaJSSMlj9C0YDuSaR/8LMZDMom2QwWliMcsmi7lWfvjrqC/dyr0FOnXrf85znPO/7fn38AYawiY2sfxW0hccP3Oo0eBDrqOMZuxhuo7dEX6bXc5Ja5STToWi1eOrpKXs/YRkFLiuTZ3ESvci61MRzGb3s/YSVFJs4w34l6CP342lmv9IucAoX6M2bvVSCGnm78opXmPlJYIkeHGMM4zgNx6Mdx+Onge/Gl3yA/rBWObFuAotKw3u96Daw0Saw0UngYPYLuPki8CY18RatAidxjzssRSvfbRuL4XY08dylZ0ILjOAgUw8xGn0nFO0wnoP0fIs5XOMJazhKyCoecIt5HWIAe/kbXsNmtLLWNaZwHpbrf443sLlytoRw+zUAAAAASUVORK5CYII=",
});

const pagesAll = Math.ceil(467 / 12);
console.log(pagesAll);