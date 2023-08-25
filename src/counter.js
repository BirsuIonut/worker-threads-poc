export async function calculateCount() {
    console.time("Counting");
    return new Promise((resolve, reject) => {
        let counter = 0;
        for (let i = 0; i < 2_000_000_000; i++) {
            counter++;
        }

        console.timeEnd("Counting");
        console.log("Counting finish!");
        resolve(counter);
    });
}