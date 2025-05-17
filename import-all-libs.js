async function getLibFiles(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        if (!Array.isArray(data.libs)) {
            throw new Error("The JSON does not contain a 'libs' array.");
        }

        const files = data.libs
            .filter(lib => typeof lib.file === 'string')
            .map(lib => lib.file);

        return files;
    } catch (error) {
        console.error("Error fetching or parsing JSON:", error);
        return [];
    }
}

let libsJsonUrl = 'https://cdn.jsdelivr.net/gh/SilvanZwick/js-libs@main/all-libs.json';

// Send request to JSdelivr to refresh cache
async function fetchData(url) {
    await fetch(url);
}
await fetchData(libsJsonUrl);

// Get the list of files
let libsArray = await getLibFiles(libsJsonUrl);

// Import the libs
for (let i = 0; i < libsArray.length - 2; ++i) {
    try {
        await import(libsArray[i]);  // Dynamically import each file
        console.log(`Imported: ${libsArray[i]}`);
    } catch (error) {
        console.error(`Failed to import ${libsArray[i]}:`, error);
    }
}
