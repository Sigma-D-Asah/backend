# API Pagination Guide - Cursor-Based Pagination

Backend sekarang menggunakan **cursor-based pagination** untuk semua list endpoints. Ini lebih efisien dan scalable dibandingkan offset-based pagination.

---

## Keuntungan Cursor-Based Pagination

### Dibanding Offset Pagination (`?page=2&limit=20`)

| Feature | Offset Pagination | Cursor Pagination |
|---------|-------------------|-------------------|
| **Performance** | Lambat untuk halaman jauh | Konstan, selalu cepat |
| **Consistency** | Data bisa bergeser | Data konsisten |
| **Scalability** | Buruk untuk data besar | Excellent |
| **Use Case** | Halaman kecil (<10k rows) | Data besar, infinite scroll |

### Contoh Performance:
```
Offset Pagination (SKIP 10000 LIMIT 50):
- Query time: 2-5 detik untuk halaman 200
- Database harus scan 10,000+ rows

Cursor Pagination (WHERE timestamp < '2024-01-01' LIMIT 50):
- Query time: 50-100ms (always fast!)
- Database menggunakan index langsung
```

---

## API Endpoints dengan Pagination

### 1. **Sensor Readings**

#### GET `/api/v1/sensors`
Get all sensor readings dengan pagination.

**Query Parameters:**
```
limit: number (optional, default: 50, max: 100)
cursor: string (optional, timestamp untuk halaman berikutnya)
```

**Response:**
```json
{
  "success": true,
  "readings": [
    {
      "readingId": "uuid",
      "machineId": "uuid",
      "airTemperatureK": 298.5,
      "processTemperatureK": 312.1,
      "rotationalSpeedRpm": 1450,
      "torqueNm": 42.3,
      "toolWearMin": 185,
      "isProcessed": true,
      "timestamp": "2024-12-12T10:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "2024-12-12T10:25:00Z",
    "hasMore": true
  }
}
```

#### GET `/api/v1/sensors/machine/:machineId`
Get sensor readings untuk mesin tertentu.

**Query Parameters:** Same as above

**Response:** Same as above

---

### 2. **AI Predictions**

#### GET `/api/v1/predictions`
Get all AI predictions.

**Query Parameters:**
```
limit: number (optional, default: 50, max: 100)
cursor: string (optional, createdAt timestamp)
```

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "predictionId": "uuid",
      "machineId": "uuid",
      "isFailure": true,
      "failureType": "Tool Wear Failure",
      "confidenceScore": 0.85,
      "naturalLanguageReason": "Keausan alat pada 185 menit...",
      "createdAt": "2024-12-12T10:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "2024-12-12T10:25:00Z",
    "hasMore": true
  }
}
```

#### GET `/api/v1/predictions/machine/:machineId`
Get predictions untuk mesin tertentu.

#### GET `/api/v1/predictions/failures`
Get hanya predictions dengan failure (isFailure = true).

**Response:** Same structure

---

### 3. **Maintenance Tickets**

#### GET `/api/v1/tickets`
Get all maintenance tickets.

**Query Parameters:**
```
limit: number (optional, default: 50, max: 100)
cursor: string (optional, createdAt timestamp)
```

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "ticketId": "uuid",
      "ticketNumber": 1001,
      "machineId": "uuid",
      "title": "Preventive Maintenance Required",
      "description": "Tool wear approaching limit",
      "priority": "HIGH",
      "status": "OPEN",
      "createdAt": "2024-12-12T10:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "2024-12-12T10:25:00Z",
    "hasMore": true
  }
}
```

---

## Frontend Implementation Examples

### React Example (Infinite Scroll)

```typescript
import { useState, useEffect } from 'react';

interface Pagination {
  nextCursor: string | null;
  hasMore: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

function usePaginatedData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const url = cursor 
        ? `${endpoint}?cursor=${encodeURIComponent(cursor)}&limit=20`
        : `${endpoint}?limit=20`;
      
      const response = await fetch(url);
      const result: ApiResponse<T> = await response.json();

      setData(prev => [...prev, ...result.data]);
      setCursor(result.pagination.nextCursor);
      setHasMore(result.pagination.hasMore);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMore();
  }, []);

  return { data, fetchMore, hasMore, loading };
}

// Usage
function SensorList() {
  const { data, fetchMore, hasMore, loading } = usePaginatedData('/api/v1/sensors');

  return (
    <div>
      {data.map(item => (
        <SensorCard key={item.readingId} data={item} />
      ))}
      
      {hasMore && (
        <button onClick={fetchMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Load More Button Pattern

```typescript
function PredictionsList() {
  const [predictions, setPredictions] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const url = cursor
      ? `/api/v1/predictions?cursor=${cursor}&limit=20`
      : `/api/v1/predictions?limit=20`;
    
    const res = await fetch(url);
    const data = await res.json();

    setPredictions(prev => [...prev, ...data.predictions]);
    setCursor(data.pagination.nextCursor);
    setHasMore(data.pagination.hasMore);
  };

  return (
    <div>
      {predictions.map(p => <PredictionCard key={p.predictionId} {...p} />)}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

### React Query / TanStack Query

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function useSensorReadings() {
  return useInfiniteQuery({
    queryKey: ['sensors'],
    queryFn: async ({ pageParam = null }) => {
      const url = pageParam
        ? `/api/v1/sensors?cursor=${pageParam}&limit=20`
        : `/api/v1/sensors?limit=20`;
      
      const res = await fetch(url);
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
  });
}

// Usage
function SensorInfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSensorReadings();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.readings.map(reading => (
            <SensorCard key={reading.readingId} data={reading} />
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

---

## Best Practices

### 1. **Limit Size**
```typescript
// Good
const limit = 20; // Reasonable page size
const limit = 50; // Max recommended

// Bad
const limit = 1000; // Too large, defeats pagination purpose
```

### 2. **Store Cursor Properly**
```typescript
// Good - Store cursor from response
const cursor = response.pagination.nextCursor;

// Bad - Don't manually construct cursor
const cursor = data[data.length - 1].timestamp; // Might be incorrect
```

### 3. **Handle Loading States**
```typescript
// Good
if (loading) return <Spinner />;
if (error) return <ErrorMessage />;
if (!data.length) return <EmptyState />;
```

### 4. **Infinite Scroll with Intersection Observer**
```typescript
function useInfiniteScroll(callback: () => void) {
  const observerRef = useRef<IntersectionObserver>();
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        callback();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [callback]);

  return lastElementRef;
}

// Usage
function SensorList() {
  const { data, fetchMore, hasMore } = usePaginatedData('/api/v1/sensors');
  const lastElementRef = useInfiniteScroll(() => {
    if (hasMore) fetchMore();
  });

  return (
    <div>
      {data.map((item, index) => (
        <div
          key={item.id}
          ref={index === data.length - 1 ? lastElementRef : null}
        >
          <SensorCard data={item} />
        </div>
      ))}
    </div>
  );
}
```

---

## Rate Limiting

### Chat Endpoint Rate Limits

**Dual Layer Protection:**

1. **Burst Protection**: 10 messages per minute
2. **Daily Limit**: 50 messages per day

**Response saat Rate Limit:**
```json
{
  "success": false,
  "error": "Terlalu banyak permintaan. Mohon tunggu sebentar.",
  "retryAfter": 60
}
```

atau

```json
{
  "success": false,
  "error": "Batas harian tercapai. Coba lagi besok.",
  "retryAfter": 86400,
  "remaining": 0
}
```

**Frontend Handling:**
```typescript
async function sendChatMessage(message: string) {
  try {
    const res = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (res.status === 429) {
      const data = await res.json();
      throw new Error(data.error);
    }

    return res.json();
  } catch (error) {
    // Show error to user
    toast.error(error.message);
  }
}
```

---

## Performance Metrics

### Expected Response Times

| Endpoint | First Page | Subsequent Pages |
|----------|-----------|------------------|
| `/sensors` | 50-100ms | 50-100ms |
| `/predictions` | 50-100ms | 50-100ms |
| `/tickets` | 30-50ms | 30-50ms |

### Data Transfer Optimization

**Before Pagination:**
- Request 1000 sensor readings: ~500 KB
- Load time: 2-5 seconds

**After Cursor Pagination:**
- Request 20 sensor readings: ~10 KB
- Load time: 50-100ms
- **95% improvement!**

---

## FAQ

### Q: Kenapa tidak pakai offset pagination (`?page=2`)?
**A:** Offset pagination lambat untuk data besar. Cursor-based selalu cepat karena pakai index.

### Q: Apakah cursor bisa digunakan untuk halaman sebelumnya (prev)?
**A:** Tidak, cursor-based dirancang untuk forward pagination (next). Untuk prev, perlu implementasi berbeda atau cache di frontend.

### Q: Bagaimana jika ada data baru ditambahkan saat pagination?
**A:** Cursor-based pagination konsisten. Data baru tidak akan menggeser halaman yang sudah diload.

### Q: Berapa limit maksimal yang direkomendasikan?
**A:** 20-50 items per page. Max 100. Lebih dari itu tidak disarankan.

### Q: Apakah bisa kombinasi dengan filter?
**A:** Ya, tambahkan filter sebagai query parameter lain. Contoh: `/api/v1/predictions?status=OPEN&cursor=xxx&limit=20`

---

## UI/UX Recommendations

### 1. **Infinite Scroll** (Recommended for Mobile)
- Otomatis load saat scroll
- Smooth user experience
- Good untuk discovery

### 2. **Load More Button** (Recommended for Desktop)
- User control
- Better untuk accessibility
- Clear state

### 3. **Hybrid Approach**
- Infinite scroll pada mobile
- Load more button pada desktop
- Best of both worlds

---

## Related Documentation

- [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md)
- [API Documentation](http://localhost:3000/docs)
- [Rate Limiting Details](./RATE_LIMITING.md)

---

**Happy Coding!**

