const socket = typeof io !== 'undefined' ? io('http://localhost:5000') : null;

const formatTimeRemaining = (endTimeStr) => {
  const total = Date.parse(endTimeStr) - Date.parse(new Date());
  if (total <= 0) return { total, text: 'AUCTION ENDED', isEnded: true };

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);

  return {
    total,
    text: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    isEnded: false
  };
};

const startCountdowns = (auctions) => {
  auctions.forEach((auction) => {
    const timerElement = document.getElementById(`timer-${auction._id}`);
    const badgeElement = document.getElementById(`badge-${auction._id}`);
    const bidButton = document.getElementById(`btn-bid-${auction._id}`);

    if (!timerElement) return;

    const updateTicker = () => {
      const time = formatTimeRemaining(auction.endTime);

      if (time.isEnded || auction.status !== 'active') {
        timerElement.innerText = 'AUCTION ENDED';
        if (badgeElement) {
          badgeElement.className = 'badge bg-danger position-absolute top-0 end-0 m-2 px-3 py-2';
          badgeElement.innerHTML = '<i class="bi bi-x-circle me-1"></i> CLOSED';
        }
        if (bidButton) {
          bidButton.classList.add('disabled', 'btn-secondary');
          bidButton.classList.remove('btn-primary');
          bidButton.innerText = 'Auction Closed';
          bidButton.removeAttribute('href');
        }
      } else {
        timerElement.innerText = time.text;
      }
    };

    updateTicker();
    setInterval(updateTicker, 1000);
  });
};

const loadAuctions = async () => {
  const grid = document.getElementById('auctionsGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted mt-2">Loading campus marketplace items...</p>
    </div>
  `;

  try {
    const res = await fetch('http://localhost:5000/api/auctions');
    const data = await res.json();

    grid.innerHTML = '';

    if (!data.auctions || data.auctions.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="card border-0 shadow-sm p-5 max-w-500 mx-auto">
            <i class="bi bi-box-seam display-1 text-muted mb-3"></i>
            <h4 class="fw-bold">No Active Auctions Found</h4>
            <p class="text-muted">Be the first student or seller to list an item on campus!</p>
            <a href="create-listing.html" class="btn btn-primary fw-bold mx-auto mt-2">+ Post First Listing</a>
          </div>
        </div>
      `;
      return;
    }

    data.auctions.forEach((auction) => {
      if (socket) socket.emit('joinAuctionRoom', auction._id);

      const defaultImg = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
      const imageSrc = auction.imageUrl && auction.imageUrl !== 'default-product.png' ? auction.imageUrl : defaultImg;
      const sellerName = auction.seller && typeof auction.seller === 'object' ? (auction.seller.fullName || 'Campus Seller') : 'Campus Seller';

      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.id = `auction-card-${auction._id}`;
      card.innerHTML = `
        <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
          <div class="position-relative">
            <img src="${imageSrc}" class="card-img-top" alt="${auction.productTitle}" style="height: 200px; object-fit: cover;">
            <span class="badge ${auction.status === 'active' ? 'bg-primary' : 'bg-danger'} position-absolute top-0 end-0 m-2 px-3 py-2" id="badge-${auction._id}">
              <i class="bi bi-clock me-1"></i> ${auction.status.toUpperCase()}
            </span>
          </div>
          <div class="card-body d-flex flex-column p-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-light text-dark border">${auction.category}</span>
              <span class="badge bg-dark text-warning font-monospace p-2">
                ⏳ <span id="timer-${auction._id}">--:--:--</span>
              </span>
            </div>
            
            <h5 class="card-title fw-bold text-dark mb-2">${auction.productTitle}</h5>
            <p class="card-text text-muted small flex-grow-1">${auction.description}</p>
            <hr>
            
            <div class="d-flex justify-content-between align-items-end mb-3">
              <div>
                <small class="text-muted d-block">Current Price</small>
                <span class="fs-4 fw-bold text-gold" id="price-${auction._id}">₦${auction.currentPrice.toLocaleString()}</span>
              </div>
              <div class="text-end">
                <small class="text-muted d-block">Seller</small>
                <span class="badge bg-secondary">${sellerName}</span>
              </div>
            </div>

            <a href="place-bid.html?id=${auction._id}" class="btn ${auction.status === 'active' ? 'btn-gold' : 'btn-secondary disabled'} w-100 fw-bold py-2" id="btn-bid-${auction._id}">
              <i class="bi bi-gavel me-1"></i> ${auction.status === 'active' ? 'Place Bid' : 'Auction Closed'}
            </a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    startCountdowns(data.auctions);

  } catch (err) {
    console.error('Failed to load auctions:', err);
    grid.innerHTML = `<div class="col-12 text-center text-danger py-5">Failed to connect to backend server. Make sure Node server is running on port 5000.</div>`;
  }
};

if (socket) {
  socket.on('bidUpdated', (data) => {
    const priceElement = document.getElementById(`price-${data.auctionId}`);
    if (priceElement) {
      priceElement.innerText = `₦${data.newPrice.toLocaleString()}`;
    }
  });

  socket.on('auctionClosed', () => {
    loadAuctions();
  });
}

document.addEventListener('DOMContentLoaded', loadAuctions);