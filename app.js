import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5Fifb0Ob_HcW7D9mQ8BSIQsfcsvXiBDM",
  authDomain: "elimina-5da5d.firebaseapp.com",
  projectId: "elimina-5da5d",
  storageBucket: "elimina-5da5d.firebasestorage.app",
  messagingSenderId: "624057434139",
  appId: "1:624057434139:web:f41e8a2274985b6fa538be",
  measurementId: "G-HH2NWX2EYP",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("review-form");
const reviewsContainer = document.getElementById("reviews-container");
const loadMoreBtn = document.getElementById("load-more-btn");

let ultimoDocumento = null;
const recensioniPerPagina = 5;

async function caricaRecensioni(ricominciaDaCapo = false) {
  if (ricominciaDaCapo) {
    reviewsContainer.innerHTML = "";
    ultimoDocumento = null;
  }

  let q;
  if (ultimoDocumento) {
    q = query(
      collection(db, "recensioni"),
      orderBy("data", "desc"),
      startAfter(ultimoDocumento),
      limit(recensioniPerPagina),
    );
  } else {
    q = query(
      collection(db, "recensioni"),
      orderBy("data", "desc"),
      limit(recensioniPerPagina),
    );
  }

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty && ricominciaDaCapo) {
    reviewsContainer.innerHTML =
      "<p style='color: var(--text-muted); text-align: center; padding: 20px 0;'>Nessuna recensione presente. Scrivi la prima!</p>";
    loadMoreBtn.style.display = "none";
    return;
  }

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const dataFormattata = data.data
      ? data.data.toDate().toLocaleDateString("it-IT")
      : "Oggi";

    const stelle = "⭐".repeat(data.voto || 5);

    // Novità: Estraiamo l'iniziale del nome per l'Avatar
    const iniziale = data.nome ? data.nome.charAt(0).toUpperCase() : "U";

    const reviewDiv = document.createElement("div");
    reviewDiv.classList.add("review-card");

    // Struttura HTML aggiornata per matchare il nuovo CSS
    reviewDiv.innerHTML = `
        <div class="review-header">
            <div class="user-info">
                <div class="avatar">${iniziale}</div>
                <div class="user-meta">
                    <h3>${data.nome}</h3>
                    <span class="date">${dataFormattata}</span>
                </div>
            </div>
            <div class="stars">${stelle}</div>
        </div>
        <div class="review-body">
            <p>${data.testo}</p>
        </div>
    `;
    reviewsContainer.appendChild(reviewDiv);
  });

  ultimoDocumento = querySnapshot.docs[querySnapshot.docs.length - 1];

  if (querySnapshot.docs.length < recensioniPerPagina) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "inline-block";
  }
}

caricaRecensioni(true);

loadMoreBtn.addEventListener("click", () => {
  caricaRecensioni(false);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const author = document.getElementById("author").value;
  const rating = document.getElementById("rating").value;
  const text = document.getElementById("text").value;

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = "Invio in corso...";

  try {
    await addDoc(collection(db, "recensioni"), {
      nome: author,
      voto: parseInt(rating),
      testo: text,
      data: serverTimestamp(),
    });
    form.reset();

    // Ricarichiamo le recensioni
    caricaRecensioni(true);
  } catch (error) {
    console.error("Errore nell'invio:", error);
    alert("C'è stato un problema. Riprova più tardi.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Pubblica Recensione";
  }
});
