(() => {
    const ID = "ScratchProjectFinder";

    // Prevent duplicate windows.
    const old = document.getElementById(ID);
    if (old) {
        old.remove();
        document.getElementById(ID + "-style")?.remove();
        return;
    }

    const style = document.createElement("style");
    style.id = ID + "-style";
    style.textContent = `
        #${ID} {
            position: fixed;
            top: 70px;
            right: 25px;
            width: 430px;
            max-height: calc(100vh - 100px);
            z-index: 2147483647;
            background: #ffffff;
            color: #222;
            border: 1px solid #d9d9d9;
            border-radius: 12px;
            box-shadow: 0 8px 35px rgba(0,0,0,.25);
            font-family: Arial, Helvetica, sans-serif;
            overflow: hidden;
        }

        #${ID} * {
            box-sizing: border-box;
        }

        #spfHead {
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 12px 0 15px;
            background: #4c97ff;
            color: white;
        }

        #spfBrand {
            display: flex;
            align-items: center;
            gap: 9px;
            font-size: 16px;
            font-weight: bold;
        }

        #spfIcon {
            width: 25px;
            height: 25px;
            border-radius: 5px;
        }

        #spfClose {
            width: 30px;
            height: 30px;
            border: 0;
            border-radius: 7px;
            background: rgba(255,255,255,.15);
            color: white;
            font-size: 22px;
            cursor: pointer;
        }

        #spfClose:hover {
            background: rgba(255,255,255,.25);
        }

        #spfBody {
            padding: 14px;
        }

        #spfSearchRow {
            display: flex;
            gap: 8px;
        }

        #spfInput {
            flex: 1;
            min-width: 0;
            height: 39px;
            padding: 0 11px;
            border: 1px solid #cfcfcf;
            border-radius: 7px;
            outline: none;
            font-size: 14px;
        }

        #spfInput:focus {
            border-color: #4c97ff;
            box-shadow: 0 0 0 2px rgba(76,151,255,.15);
        }

        #spfSearch {
            height: 39px;
            padding: 0 15px;
            border: 0;
            border-radius: 7px;
            background: #4c97ff;
            color: white;
            font-weight: bold;
            cursor: pointer;
        }

        #spfSearch:hover {
            background: #4285e5;
        }

        #spfSearch:disabled {
            opacity: .6;
            cursor: wait;
        }

        #spfStatus {
            margin: 10px 2px;
            color: #666;
            font-size: 12px;
        }

        #spfResults {
            max-height: calc(100vh - 210px);
            overflow-y: auto;
            padding-right: 2px;
        }

        .spfResult {
            display: flex;
            gap: 11px;
            padding: 10px;
            margin-bottom: 9px;
            border: 1px solid #e1e1e1;
            border-radius: 9px;
            background: #fafafa;
        }

        .spfThumb,
        .spfPrivate {
            flex: 0 0 120px;
            width: 120px;
            height: 90px;
            border-radius: 6px;
            object-fit: cover;
            background: #eeeeee;
        }

        .spfPrivate {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 7px;
            text-align: center;
            color: #777;
            font-size: 11px;
        }

        .spfInfo {
            min-width: 0;
            flex: 1;
        }

        .spfTitle {
            font-size: 14px;
            font-weight: bold;
            line-height: 18px;
            overflow-wrap: anywhere;
        }

        .spfAuthor {
            margin-top: 3px;
            color: #666;
            font-size: 12px;
        }

        .spfId {
            margin-top: 3px;
            color: #999;
            font-size: 11px;
        }

        .spfOpen {
            margin-top: 8px;
            height: 29px;
            padding: 0 10px;
            border: 0;
            border-radius: 6px;
            background: #4c97ff;
            color: white;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
        }

        .spfOpen:hover {
            background: #4285e5;
        }

        .spfOpen:disabled {
            background: #c8c8c8;
            cursor: default;
        }

        .spfLock {
            margin-top: 6px;
            color: #888;
            font-size: 10px;
            line-height: 13px;
        }

        .spfEmpty {
            padding: 25px 10px;
            text-align: center;
            color: #777;
            font-size: 13px;
        }
    `;

    document.head.appendChild(style);

    const box = document.createElement("div");
    box.id = ID;

    box.innerHTML = `
        <div id="spfHead">
            <div id="spfBrand">
                <img id="spfIcon"
                     src="https://scratch.mit.edu/favicon.ico"
                     alt="">
                <span>Scratch Project Finder</span>
            </div>

            <button id="spfClose" title="Close">×</button>
        </div>

        <div id="spfBody">
            <div id="spfSearchRow">
                <input
                    id="spfInput"
                    type="text"
                    placeholder="Project name or ID..."
                    autocomplete="off"
                    spellcheck="false">

                <button id="spfSearch">Search</button>
            </div>

            <div id="spfStatus">
                Enter a project name or ID.
            </div>

            <div id="spfResults"></div>
        </div>
    `;

    document.body.appendChild(box);

    const input = box.querySelector("#spfInput");
    const searchButton = box.querySelector("#spfSearch");
    const status = box.querySelector("#spfStatus");
    const results = box.querySelector("#spfResults");
    const closeButton = box.querySelector("#spfClose");

    closeButton.onclick = () => {
        box.remove();
        style.remove();
    };

    /*
        Scratch API requests are routed through this CORS proxy because
        bookmarklets run inside the Scratch webpage's origin.
    */
    async function getJSON(url) {
        const response = await fetch(
            "https://proxy.cors.dev/" + url,
            {
                headers: {
                    Accept: "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        return response.json();
    }

    function openProject(id) {
        location.href =
            "https://scratch.mit.edu/projects/" +
            encodeURIComponent(id) +
            "/";
    }

    async function getPublicProject(id) {
        try {
            const project = await getJSON(
                "https://api.scratch.mit.edu/projects/" +
                encodeURIComponent(id)
            );

            if (project && project.id) {
                return project;
            }
        } catch {
            // Not publicly accessible.
        }

        return null;
    }

    function createCard(project) {
        const id = project.id || project.projectId;

        if (!id) {
            return null;
        }

        const title =
            project.title ||
            project.name ||
            "Untitled Project";

        const author =
            project.creator?.username ||
            project.author?.username ||
            project.username ||
            "Unknown user";

        const card = document.createElement("div");
        card.className = "spfResult";

        const thumbnail = document.createElement("div");
        thumbnail.className = "spfPrivate";
        thumbnail.textContent = "Checking…";

        const info = document.createElement("div");
        info.className = "spfInfo";

        const titleElement = document.createElement("div");
        titleElement.className = "spfTitle";
        titleElement.textContent = title;

        const authorElement = document.createElement("div");
        authorElement.className = "spfAuthor";
        authorElement.textContent = "by " + author;

        const idElement = document.createElement("div");
        idElement.className = "spfId";
        idElement.textContent = "ID: " + id;

        const openButton = document.createElement("button");
        openButton.className = "spfOpen";
        openButton.textContent = "Checking…";
        openButton.disabled = true;

        info.append(
            titleElement,
            authorElement,
            idElement,
            openButton
        );

        card.append(thumbnail, info);
        results.appendChild(card);

        return {
            id,
            thumbnail,
            info,
            openButton
        };
    }

    async function verifyCard(card) {
        const project = await getPublicProject(card.id);

        if (!project) {
            card.thumbnail.className = "spfPrivate";
            card.thumbnail.textContent = "🔒 Private / unavailable";

            card.openButton.textContent = "Unavailable";
            card.openButton.disabled = true;

            const lock = document.createElement("div");
            lock.className = "spfLock";
            lock.textContent =
                "This project isn't publicly accessible.";

            card.info.appendChild(lock);
            return;
        }

        /*
            IMPORTANT:
            Use CDN2 for the actual thumbnail.

            This is the part that replaces the broken
            uploads.scratch.mit.edu URL from the old version.
        */
        const thumbnailURL =
            "https://cdn2.scratch.mit.edu/get_image/project/" +
            encodeURIComponent(card.id) +
            "_480x360.png";

        const image = document.createElement("img");

        image.className = "spfThumb";
        image.alt = "Project thumbnail";
        image.src = thumbnailURL;

        image.onerror = () => {
            card.thumbnail.className = "spfPrivate";
            card.thumbnail.textContent = "Thumbnail unavailable";
        };

        card.thumbnail.replaceWith(image);
        card.thumbnail = image;

        card.openButton.textContent = "Open Project";
        card.openButton.disabled = false;

        card.openButton.onclick = () => {
            openProject(card.id);
        };
    }

    async function searchProjects() {
        const query = input.value.trim();

        if (!query) {
            return;
        }

        /*
            DIGITS ONLY = PROJECT ID

            No search request is necessary.
        */
        if (/^\\d+$/.test(query)) {
            openProject(query);
            return;
        }

        searchButton.disabled = true;
        results.innerHTML = "";

        status.textContent = "Searching Scratch…";

        try {
            const url =
                "https://api.scratch.mit.edu/search/projects" +
                "?q=" + encodeURIComponent(query) +
                "&mode=popular" +
                "&limit=40";

            const data = await getJSON(url);

            const projects =
                Array.isArray(data)
                    ? data
                    : data.projects || [];

            if (!projects.length) {
                status.textContent = "No projects found.";

                results.innerHTML = `
                    <div class="spfEmpty">
                        No matching projects were found.
                    </div>
                `;

                return;
            }

            const cards = projects
                .map(createCard)
                .filter(Boolean);

            status.textContent =
                cards.length +
                " result" +
                (cards.length === 1 ? "" : "s") +
                " found. Checking availability…";

            /*
                Check every result at the same time instead of
                waiting for each project individually.
            */
            await Promise.all(
                cards.map(card => verifyCard(card))
            );

            status.textContent =
                cards.length +
                " result" +
                (cards.length === 1 ? "" : "s") +
                " found.";

        } catch (error) {
            console.error(
                "Scratch Project Finder:",
                error
            );

            status.textContent =
                "Search could not be completed.";

            results.innerHTML = `
                <div class="spfEmpty">
                    Scratch search could not be reached
                    from the bookmarklet.
                    <br><br>
                    Please try again.
                </div>
            `;
        } finally {
            searchButton.disabled = false;
        }
    }

    searchButton.onclick = searchProjects;

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            searchProjects();
        }
    });

    input.focus();
})();
