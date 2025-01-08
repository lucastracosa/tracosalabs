document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    const completeButtons = document.querySelectorAll(".complete-book");
    const progressText = document.getElementById("progress");
    const progressBar = document.getElementById("progress-bar");
    const saveBtn = document.getElementById("saveBtn");
    const clearBtn = document.getElementById("clearBtn");

    const API_URL = "http://localhost:3000";

    // Atualizar progresso
    const updateProgress = () => {
        const totalChapters = checkboxes.length;
        const completedChapters = Array.from(checkboxes).filter((checkbox) => checkbox.checked).length;
        const progressPercentage = Math.round((completedChapters / totalChapters) * 100);
        progressText.textContent = `${progressPercentage}%`;
        progressBar.style.width = `${progressPercentage}%`;
    };

    // Salvar progresso no backend
    const saveProgress = async () => {
        const promises = [];
        checkboxes.forEach((checkbox) => {
            const book = checkbox.id.split("-")[0];
            const chapter = parseInt(checkbox.id.split("-")[1]);
            const completed = checkbox.checked ? 1 : 0;

            promises.push(
                fetch(`${API_URL}/save`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ book, chapter, completed }),
                })
            );
        });

        await Promise.all(promises);
        alert("Progresso salvo com sucesso!");
    };

    // Carregar progresso do backend
    const loadProgress = async () => {
        const response = await fetch(`${API_URL}/progress`);
        const data = await response.json();

        data.forEach(({ book, chapter, completed }) => {
            const checkbox = document.getElementById(`${book}-${chapter}`);
            if (checkbox) {
                checkbox.checked = completed === 1;
                checkbox.parentElement.style.backgroundColor = completed === 1 ? "#4CAF50" : "#e0e0e0";
                checkbox.parentElement.style.color = completed === 1 ? "white" : "black";
            }
        });

        updateProgress();
    };

    // Completar Livro
    completeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const bookName = button.dataset.book;
            const bookChapters = document.querySelectorAll(`.chapter-grid[data-book="${bookName}"] input[type="checkbox"]`);

            bookChapters.forEach((checkbox) => {
                checkbox.checked = true;
                checkbox.parentElement.style.backgroundColor = "#4CAF50";
                checkbox.parentElement.style.color = "white";
            });

            updateProgress();
        });
    });

    // Atualizar estilo ao marcar/desmarcar capítulos
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                checkbox.parentElement.style.backgroundColor = "#4CAF50";
                checkbox.parentElement.style.color = "white";
            } else {
                checkbox.parentElement.style.backgroundColor = "#e0e0e0";
                checkbox.parentElement.style.color = "black";
            }
            updateProgress();
        });
    });

    // Salvar progresso ao clicar no botão
    saveBtn.addEventListener("click", saveProgress);

    // Limpar progresso
    clearBtn.addEventListener("click", () => {
        checkboxes.forEach((checkbox) => {
            checkbox.checked = false;
            checkbox.parentElement.style.backgroundColor = "#e0e0e0";
            checkbox.parentElement.style.color = "black";
        });
        updateProgress();
        alert("Progresso limpo!");
    });

    // Carregar progresso ao iniciar
    loadProgress();
});

