import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZgXnE45R1ihDrhRWS7BnWZi3l5vfIUNU",
  authDomain: "gabriel-e-kaique.firebaseapp.com",
  projectId: "gabriel-e-kaique",
  storageBucket: "gabriel-e-kaique.firebasestorage.app",
  messagingSenderId: "103123728412",
  appId: "1:103123728412:web:d58db26fc55217327087d9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);

function normalizeUsername(v){ return v.trim().toLowerCase(); }
function internalEmail(u){ return `${normalizeUsername(u)}@login.sondamercado.local`; }
function validUsername(u){ return /^[a-z0-9._-]{3,20}$/.test(u); }

function message(el,text,type=""){
  el.textContent=text;
  el.className="message";
  if(type) el.classList.add(type);
}

function showView(id){
  ["productsView","cartView","profileView"].forEach(v => $(v).classList.add("hidden"));
  $(id).classList.remove("hidden");
}

/* LOGIN */
$("loginButton").onclick = async () => {
  const username = normalizeUsername($("loginUsername").value);
  const password = $("loginPassword").value;

  message($("loginMessage"),"");

  if(!username || !password){
    message($("loginMessage"),"Digite o usuário e a senha.","error");
    return;
  }

  try{
    const userDoc = await getDoc(doc(db,"nomesUsuarios",username));

    if(!userDoc.exists()){
      message($("loginMessage"),"Usuário não encontrado.","error");
      return;
    }

    await signInWithEmailAndPassword(auth,internalEmail(username),password);
  }catch(error){
    console.error(error);
    message(
      $("loginMessage"),
      error.code === "auth/invalid-credential" ? "Senha incorreta." : "Não foi possível entrar.",
      "error"
    );
  }
};

/* ABRIR / FECHAR CADASTRO */
$("openRegisterButton").onclick = () => {
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");
  message($("loginMessage"),"");
};

$("backLoginButton").onclick = () => {
  $("registerForm").classList.add("hidden");
  $("loginForm").classList.remove("hidden");
  message($("registerMessage"),"");
};

/* CADASTRO */
$("registerButton").onclick = async () => {
  const nome = $("registerName").value.trim();
  const usuario = normalizeUsername($("registerUsername").value);
  const senha = $("registerPassword").value;

  message($("registerMessage"),"");

  if(!nome || !usuario || !senha){
    message($("registerMessage"),"Preencha Nome, Usuário e Senha.","error");
    return;
  }

  if(!validUsername(usuario)){
    message($("registerMessage"),"Usuário inválido. Use 3 a 20 caracteres com letras, números, ponto, hífen ou underline.","error");
    return;
  }

  if(senha.length < 6){
    message($("registerMessage"),"A senha precisa ter pelo menos 6 caracteres.","error");
    return;
  }

  try{
    const usernameRef = doc(db,"nomesUsuarios",usuario);
    const existing = await getDoc(usernameRef);

    if(existing.exists()){
      message($("registerMessage"),"Esse usuário já está cadastrado.","error");
      return;
    }

    const credential = await createUserWithEmailAndPassword(auth,internalEmail(usuario),senha);
    const uid = credential.user.uid;

    await setDoc(doc(db,"usuarios",uid),{nome,usuario});
    await setDoc(usernameRef,{uid});

    message($("registerMessage"),"Conta criada com sucesso.","success");
  }catch(error){
    console.error(error);
    message($("registerMessage"),"Não foi possível criar a conta.","error");
  }
};

$("logoutButton").onclick = () => signOut(auth);

/* NAVEGAÇÃO */
$("productsButton").onclick = async () => { showView("productsView"); await carregarProdutos(); };
$("cartButton").onclick = async () => { showView("cartView"); await carregarLista(); };
$("profileButton").onclick = async () => { showView("profileView"); await carregarPerfil(); };

/* PRODUTOS */
let produtos = [];

async function carregarProdutos(){
  const grid = $("productsGrid");
  grid.innerHTML = "<p>Carregando produtos...</p>";

  try{
    const snapshot = await getDocs(collection(db,"produtos"));
    produtos = snapshot.docs.map(d => ({id:d.id,...d.data()}));
    renderizarProdutos(produtos);
  }catch(error){
    console.error(error);
    grid.innerHTML = "<p>Erro ao carregar os produtos.</p>";
  }
}

function renderizarProdutos(lista){
  const grid = $("productsGrid");
  grid.innerHTML = "";

  if(!lista.length){
    grid.innerHTML = "<p>Nenhum produto cadastrado no Firestore ainda.</p>";
    return;
  }

  lista.forEach(p => {
    const estoque = Number(p.estoque || 0);
    const preco = Number(p.preco || 0);

    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("div");
    image.className = "product-image";

    if(p.imagem){
      const img = document.createElement("img");
      img.src = p.imagem;
      img.alt = p.nome || "Produto";
      image.appendChild(img);
    }else{
      image.innerHTML = "<div class='image-placeholder'>Foto do produto</div>";
    }

    const code = document.createElement("div");
    code.className = "product-code";
    code.textContent = p.codigo || p.id;

    const name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = p.nome || "Produto";

    const category = document.createElement("div");
    category.className = "product-category";
    category.textContent = p.categoria || "";

    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = `R$ ${preco.toFixed(2)}`;

    const stock = document.createElement("div");
    stock.className = "stock";
    stock.textContent = `Estoque: ${estoque}`;

    const qtyRow = document.createElement("div");
    qtyRow.className = "qty-row";

    const minus = document.createElement("button");
    minus.className = "qty-button";
    minus.textContent = "-";

    const value = document.createElement("span");
    value.className = "qty-value";
    value.textContent = estoque > 0 ? "1" : "0";

    const plus = document.createElement("button");
    plus.className = "qty-button";
    plus.textContent = "+";

    let quantidade = estoque > 0 ? 1 : 0;

    minus.onclick = () => {
      if(quantidade > 1){ quantidade--; value.textContent = quantidade; }
    };

    plus.onclick = () => {
      if(quantidade < estoque){ quantidade++; value.textContent = quantidade; }
    };

    const add = document.createElement("button");
    add.className = "add-button";
    add.textContent = estoque > 0 ? "Adicionar à lista" : "Sem estoque";
    add.disabled = estoque <= 0;

    add.onclick = async () => {
      await adicionarAoCarrinho(p, quantidade);
    };

    qtyRow.append(minus,value,plus);
    card.append(image,code,name,category,price,stock,qtyRow,add);
    grid.appendChild(card);
  });
}

$("searchProducts").addEventListener("input", e => {
  const termo = e.target.value.trim().toLowerCase();

  if(!termo){
    renderizarProdutos(produtos);
    return;
  }

  const resultado = produtos.filter(p =>
    [p.codigo,p.nome,p.categoria,p.descricao]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(termo)
  );

  renderizarProdutos(resultado);
});

/* CARRINHO */
async function adicionarAoCarrinho(produto, quantidade){
  const uid = auth.currentUser.uid;
  const ref = doc(db,"usuarios",uid,"carrinho",produto.id);

  try{
    const atual = await getDoc(ref);
    const quantidadeAtual = atual.exists() ? Number(atual.data().quantidade || 0) : 0;
    const novaQuantidade = quantidadeAtual + quantidade;

    if(novaQuantidade > Number(produto.estoque || 0)){
      message($("appMessage"),"A quantidade escolhida ultrapassa o estoque.","error");
      return;
    }

    await setDoc(ref,{
      produtoId:produto.id,
      codigo:produto.codigo || produto.id,
      nome:produto.nome || "Produto",
      categoria:produto.categoria || "",
      preco:Number(produto.preco || 0),
      imagem:produto.imagem || "",
      quantidade:novaQuantidade
    });

    message($("appMessage"),"Produto adicionado à lista.","success");
    await atualizarContador();
  }catch(error){
    console.error(error);
    message($("appMessage"),"Não foi possível adicionar o produto.","error");
  }
}

async function carregarLista(){
  const uid = auth.currentUser.uid;
  const area = $("cartList");
  area.innerHTML = "<p>Carregando...</p>";

  try{
    const snapshot = await getDocs(collection(db,"usuarios",uid,"carrinho"));
    area.innerHTML = "";

    if(snapshot.empty){
      area.innerHTML = "<p>Sua lista está vazia.</p>";
      $("cartTotal").textContent = "";
      $("cartCount").textContent = "0";
      return;
    }

    let total = 0;
    let quantidadeTotal = 0;

    snapshot.forEach(d => {
      const i = d.data();
      const q = Number(i.quantidade || 1);
      const preco = Number(i.preco || 0);
      const subtotal = q * preco;

      total += subtotal;
      quantidadeTotal += q;

      const item = document.createElement("div");
      item.className = "cart-item";
      item.innerHTML = `<h3>${i.nome || "Produto"}</h3>
        <p>${i.categoria || ""}</p>
        <p>R$ ${preco.toFixed(2)} cada</p>
        <p>Subtotal: R$ ${subtotal.toFixed(2)}</p>`;

      const controls = document.createElement("div");
      controls.className = "cart-controls";

      const minus = document.createElement("button");
      minus.className = "btn";
      minus.textContent = "-";
      minus.onclick = () => alterarQuantidade(d.id,q-1);

      const number = document.createElement("strong");
      number.textContent = q;

      const plus = document.createElement("button");
      plus.className = "btn";
      plus.textContent = "+";
      plus.onclick = () => alterarQuantidade(d.id,q+1);

      const remove = document.createElement("button");
      remove.className = "btn btn-dark";
      remove.textContent = "Tirar da lista";
      remove.onclick = () => removerDaLista(d.id);

      controls.append(minus,number,plus,remove);
      item.appendChild(controls);
      area.appendChild(item);
    });

    $("cartTotal").textContent = `Total da lista: R$ ${total.toFixed(2)}`;
    $("cartCount").textContent = quantidadeTotal;

  }catch(error){
    console.error(error);
    area.innerHTML = "<p>Não foi possível carregar sua lista.</p>";
  }
}

async function alterarQuantidade(produtoId,novaQuantidade){
  const ref = doc(db,"usuarios",auth.currentUser.uid,"carrinho",produtoId);

  if(novaQuantidade <= 0) await deleteDoc(ref);
  else await updateDoc(ref,{quantidade:novaQuantidade});

  await carregarLista();
  await atualizarContador();
}

async function removerDaLista(produtoId){
  await deleteDoc(doc(db,"usuarios",auth.currentUser.uid,"carrinho",produtoId));
  await carregarLista();
  await atualizarContador();
}

async function atualizarContador(){
  const snapshot = await getDocs(
    collection(db,"usuarios",auth.currentUser.uid,"carrinho")
  );

  let total = 0;
  snapshot.forEach(d => total += Number(d.data().quantidade || 0));
  $("cartCount").textContent = total;
}

/* PERFIL */
async function carregarPerfil(){
  const uid = auth.currentUser.uid;
  const snapshot = await getDoc(doc(db,"usuarios",uid));

  if(!snapshot.exists()) return;

  const dados = snapshot.data();

  $("profileNameText").textContent = dados.nome || "";
  $("profileUsernameText").textContent = dados.usuario || "";
  $("profileNameInput").value = dados.nome || "";
  $("loggedUser").textContent = `Olá, ${dados.nome || dados.usuario || ""}`;
}

$("saveProfileButton").onclick = async () => {
  const uid = auth.currentUser.uid;
  const nome = $("profileNameInput").value.trim();

  if(!nome){
    message($("appMessage"),"Digite um nome.","error");
    return;
  }

  await setDoc(
    doc(db,"usuarios",uid),
    {nome},
    {merge:true}
  );

  await carregarPerfil();
  message($("appMessage"),"Perfil salvo.","success");
};

/* AUTH STATE */
onAuthStateChanged(auth, async user => {
  if(user){
    $("loginScreen").classList.add("hidden");
    $("appScreen").classList.remove("hidden");
    $("loggedUser").classList.remove("hidden");

    showView("productsView");
    await carregarPerfil();
    await carregarProdutos();
    await atualizarContador();
  }else{
    $("loginScreen").classList.remove("hidden");
    $("appScreen").classList.add("hidden");
    $("loggedUser").classList.add("hidden");
  }
});

console.log("SondaMERCADO carregado.");
