import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAZgXnE45R1ihDrhRWS7BnWZi3l5vfIUNU",
    authDomain: "gabriel-e-kaique.firebaseapp.com",
    projectId: "gabriel-e-kaique",
    storageBucket: "gabriel-e-kaique.firebasestorage.app",
    messagingSenderId: "103123728412",
    appId: "1:103123728412:web:d58db26fc55217327087d9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("formCadastro");
const lista = document.getElementById("listaUsuarios");
const mensagem = document.getElementById("mensagem");

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function listarUsuarios() {
    lista.innerHTML = "Carregando...";

    try {
        const snapshot = await getDocs(collection(db, "usuarios"));

        if (snapshot.empty) {
            lista.innerHTML = "Nenhum usuário cadastrado.";
            return;
        }

        lista.innerHTML = "";

        snapshot.forEach((item) => {
            const usuario = item.data();
            const id = item.id;

            const bloco = document.createElement("div");
            bloco.style.marginBottom = "16px";

            bloco.innerHTML = `
                <strong>${escapeHtml(usuario.nome ?? "")}</strong><br>
                ${escapeHtml(usuario.email ?? "")}<br><br>
            `;

            const editar = document.createElement("button");
            editar.textContent = "Editar";
            editar.addEventListener("click", () => editarUsuario(id, usuario));

            const excluir = document.createElement("button");
            excluir.textContent = "Excluir";
            excluir.style.marginLeft = "8px";
            excluir.addEventListener("click", () => excluirUsuario(id));

            bloco.appendChild(editar);
            bloco.appendChild(excluir);

            const separador = document.createElement("hr");
            bloco.appendChild(separador);

            lista.appendChild(bloco);
        });
    } catch (erro) {
        console.error(erro);
        lista.innerHTML = "Erro ao carregar os usuários.";
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!nome || !email) {
        return;
    }

    mensagem.textContent = "Salvando...";

    try {
        await addDoc(collection(db, "usuarios"), {
            nome,
            email
        });

        mensagem.textContent = "Usuário cadastrado com sucesso.";
        form.reset();
        await listarUsuarios();
    } catch (erro) {
        console.error(erro);
        mensagem.textContent = "Erro ao cadastrar. Veja o Console do navegador.";
    }
});

async function editarUsuario(id, usuarioAtual) {
    const novoNome = prompt("Novo nome:", usuarioAtual.nome ?? "");
    if (novoNome === null) return;

    const novoEmail = prompt("Novo e-mail:", usuarioAtual.email ?? "");
    if (novoEmail === null) return;

    try {
        await updateDoc(doc(db, "usuarios", id), {
            nome: novoNome.trim(),
            email: novoEmail.trim()
        });

        mensagem.textContent = "Usuário atualizado.";
        await listarUsuarios();
    } catch (erro) {
        console.error(erro);
        mensagem.textContent = "Erro ao atualizar.";
    }
}

async function excluirUsuario(id) {
    const confirmar = confirm("Deseja realmente excluir este usuário?");
    if (!confirmar) return;

    try {
        await deleteDoc(doc(db, "usuarios", id));

        mensagem.textContent = "Usuário excluído.";
        await listarUsuarios();
    } catch (erro) {
        console.error(erro);
        mensagem.textContent = "Erro ao excluir.";
    }
}

console.log("Firebase conectado!");
listarUsuarios();
