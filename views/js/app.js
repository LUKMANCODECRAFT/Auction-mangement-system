// Dynamic BASE_URL for API & Socket connections
const getAppBaseUrl = () => {
  return window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:5000'
    : window.location.origin;
};

const socket = typeof io !== 'undefined' ? io(getAppBaseUrl()) : null;

const formatTimeRemaining = (createdAt, durationHours) => {
  const createdDate = createdAt ? new Date(createdAt).getTime() : new Date().getTime();
  const validDuration = parseFloat(durationHours) || 24;
  const endTime = createdDate + (validDuration * 60 * 60 * 1000);
  const now = new Date().getTime();
  const diff = endTime - now;

  if (diff <= 0) return { total: diff, text: 'AUCTION ENDED', isEnded: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    total: diff,
    text: `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
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
      const time = formatTimeRemaining(auction.createdAt, auction.durationHours);

      if (time.isEnded || auction.status !== 'active') {
        timerElement.innerText = 'AUCTION ENDED';
        if (badgeElement) {
          badgeElement.className = 'badge bg-danger position-absolute top-0 end-0 m-2 px-3 py-2 shadow';
          badgeElement.innerHTML = '<i class="bi bi-x-circle me-1"></i> CLOSED';
        }
        if (bidButton && !bidButton.classList.contains('disabled')) {
          bidButton.classList.add('disabled', 'btn-secondary');
          bidButton.classList.remove('btn-gold', 'btn-primary');
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
  const grid = document.getElementById('auctionsGrid') || document.getElementById('auctionListingsContainer');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted mt-2">Loading Federal University Dutse auctions...</p>
    </div>
  `;

  try {
    const baseUrl = getAppBaseUrl();
    const res = await fetch(`${baseUrl}/api/auctions?status=active`);
    const data = await res.json();

    grid.innerHTML = '';

    if (!data.auctions || data.auctions.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="card border-0 shadow-sm p-5 max-w-500 mx-auto">
            <i class="bi bi-box-seam display-1 text-muted mb-3"></i>
            <h4 class="fw-bold text-dark">No Active Auctions Found</h4>
            <p class="text-muted">Be the first student or seller to list a campus asset!</p>
            <a href="create-listing.html" class="btn btn-gold fw-bold mx-auto mt-2">+ Post First Listing</a>
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

      const time = formatTimeRemaining(auction.createdAt, auction.durationHours);

      const card = document.createElement('div');
      card.className = 'col-md-6 col-lg-4 mb-4';
      card.id = `auction-card-${auction._id}`;
      card.innerHTML = `
        <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden card-hover">
          <div class="position-relative">
            <img src="${imageSrc}" class="card-img-top" alt="${auction.productTitle}" style="height: 210px; object-fit: cover;">
            <span class="badge ${time.isEnded ? 'bg-danger' : 'bg-dark'} text-warning position-absolute top-0 end-0 m-2 px-3 py-2 shadow" id="badge-${auction._id}">
              ⏳ <span id="timer-${auction._id}">${time.text}</span>
            </span>
          </div>
          <div class="card-body d-flex flex-column p-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-light text-dark border">${auction.category}</span>
              <span class="badge bg-success p-2">LIVE</span>
            </div>
            
            <h5 class="card-title fw-bold text-dark mb-2">${auction.productTitle}</h5>
            <p class="card-text text-muted small flex-grow-1 text-truncate">${auction.description}</p>
            <hr class="my-3">
            
            <div class="d-flex justify-content-between align-items-end mb-3">
              <div>
                <small class="text-muted d-block fw-bold">Current Bid</small>
                <span class="fs-4 fw-extrabold text-success" id="price-${auction._id}">₦${(auction.currentPrice || 0).toLocaleString()}</span>
              </div>
              <div class="text-end">
                <small class="text-muted d-block">Seller</small>
                <span class="badge bg-secondary">${sellerName}</span>
              </div>
            </div>

            <a href="place-bid.html?id=${auction._id}" class="btn btn-gold w-100 fw-bold py-2 shadow-sm" id="btn-bid-${auction._id}">
              <i class="bi bi-gavel me-1"></i> Place Bid
            </a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    startCountdowns(data.auctions);

  } catch (err) {
    console.error('Failed to load auctions:', err);
    grid.innerHTML = `
      <div class="col-12 text-center text-danger py-5">
        <i class="bi bi-exclamation-triangle-fill fs-2 mb-2 d-block"></i>
        <h5 class="fw-bold text-dark">Connection Error</h5>
        <p class="text-muted small">${err.message}</p>
        <button class="btn btn-outline-primary btn-sm fw-bold" onclick="loadAuctions()">Retry Loading</button>
      </div>
    `;
  }
};

if (socket) {
  socket.on('bidUpdated', (data) => {
    const priceElement = document.getElementById(`price-${data.auctionId}`);
    if (priceElement) {
      priceElement.innerText = `₦${data.newPrice.toLocaleString()}`;
      priceElement.classList.add('text-warning');
      setTimeout(() => priceElement.classList.remove('text-warning'), 1500);
    }
  });

  socket.on('auctionEnded', () => {
    loadAuctions();
  });
}

document.addEventListener('DOMContentLoaded', loadAuctions);